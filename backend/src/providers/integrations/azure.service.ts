import { Injectable, Logger } from '@nestjs/common';
import { ClientSecretCredential } from '@azure/identity';
import { ComputeManagementClient } from '@azure/arm-compute';
import { StorageManagementClient } from '@azure/arm-storage';

export interface AzureCredentials {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  subscriptionId: string;
}

export interface AzureResource {
  id: string;
  name: string;
  type: string;
  status: string;
  region: string;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

@Injectable()
export class AzureService {
  private readonly logger = new Logger(AzureService.name);

  /**
   * Initialize Azure clients with credentials
   */
  private initializeClients(credentials: AzureCredentials) {
    const credential = new ClientSecretCredential(
      credentials.tenantId,
      credentials.clientId,
      credentials.clientSecret,
    );

    return {
      compute: new ComputeManagementClient(credential, credentials.subscriptionId),
      storage: new StorageManagementClient(credential, credentials.subscriptionId),
    };
  }

  /**
   * Test Azure credentials by making a simple API call
   */
  async testConnection(credentials: AzureCredentials): Promise<boolean> {
    try {
      const { compute } = this.initializeClients(credentials);
      // Try to list VMs (will work even if there are none)
      const iterator = compute.virtualMachines.listAll();
      await iterator.next();
      this.logger.log('Azure connection test successful');
      return true;
    } catch (error) {
      this.logger.error('Azure connection test failed', error);
      throw new Error(`Azure connection failed: ${error.message}`);
    }
  }

  /**
   * List all Virtual Machines
   */
  async listVirtualMachines(credentials: AzureCredentials): Promise<AzureResource[]> {
    try {
      const { compute } = this.initializeClients(credentials);
      const vms: AzureResource[] = [];

      for await (const vm of compute.virtualMachines.listAll()) {
        // Get instance view for status
        let status = 'unknown';
        try {
          const resourceGroup = this.extractResourceGroup(vm.id);
          const instanceView = await compute.virtualMachines.instanceView(resourceGroup, vm.name);
          const powerState = instanceView.statuses?.find((s) => s.code?.startsWith('PowerState/'));
          status = powerState?.displayStatus || 'unknown';
        } catch {
          // If we can't get instance view, use provisioning state
          status = vm.provisioningState || 'unknown';
        }

        vms.push({
          id: vm.id,
          name: vm.name,
          type: 'vm',
          status,
          region: vm.location,
          tags: vm.tags || {},
          metadata: {
            vmSize: vm.hardwareProfile?.vmSize,
            osType: vm.storageProfile?.osDisk?.osType,
            imageReference: vm.storageProfile?.imageReference,
            provisioningState: vm.provisioningState,
          },
        });
      }

      this.logger.log(`Found ${vms.length} Azure VMs`);
      return vms;
    } catch (error) {
      this.logger.error('Failed to list Azure VMs', error);
      throw new Error(`Failed to list Azure VMs: ${error.message}`);
    }
  }

  /**
   * List all Storage Accounts
   */
  async listStorageAccounts(credentials: AzureCredentials): Promise<AzureResource[]> {
    try {
      const { storage } = this.initializeClients(credentials);
      const accounts: AzureResource[] = [];

      for await (const account of storage.storageAccounts.list()) {
        accounts.push({
          id: account.id,
          name: account.name,
          type: 'storage',
          status: account.provisioningState || 'unknown',
          region: account.location,
          tags: account.tags || {},
          metadata: {
            kind: account.kind,
            sku: account.sku?.name,
            accessTier: account.accessTier,
            creationTime: account.creationTime,
            primaryLocation: account.primaryLocation,
            statusOfPrimary: account.statusOfPrimary,
          },
        });
      }

      this.logger.log(`Found ${accounts.length} Azure Storage Accounts`);
      return accounts;
    } catch (error) {
      this.logger.error('Failed to list Azure Storage Accounts', error);
      throw new Error(`Failed to list Azure Storage Accounts: ${error.message}`);
    }
  }

  /**
   * Get all resources across all Azure services
   */
  async getAllResources(credentials: AzureCredentials): Promise<AzureResource[]> {
    try {
      const [vms, storageAccounts] = await Promise.all([
        this.listVirtualMachines(credentials),
        this.listStorageAccounts(credentials),
      ]);

      const allResources = [...vms, ...storageAccounts];
      this.logger.log(`Total Azure resources found: ${allResources.length}`);

      return allResources;
    } catch (error) {
      this.logger.error('Failed to get all Azure resources', error);
      throw error;
    }
  }

  /**
   * Start a Virtual Machine
   */
  async startVirtualMachine(credentials: AzureCredentials, vmId: string): Promise<void> {
    try {
      const { compute } = this.initializeClients(credentials);
      const resourceGroup = this.extractResourceGroup(vmId);
      const vmName = this.extractResourceName(vmId);

      await compute.virtualMachines.beginStartAndWait(resourceGroup, vmName);
      this.logger.log(`Started Azure VM: ${vmName}`);
    } catch (error) {
      this.logger.error(`Failed to start Azure VM ${vmId}`, error);
      throw new Error(`Failed to start Azure VM: ${error.message}`);
    }
  }

  /**
   * Stop a Virtual Machine
   */
  async stopVirtualMachine(credentials: AzureCredentials, vmId: string): Promise<void> {
    try {
      const { compute } = this.initializeClients(credentials);
      const resourceGroup = this.extractResourceGroup(vmId);
      const vmName = this.extractResourceName(vmId);

      await compute.virtualMachines.beginPowerOffAndWait(resourceGroup, vmName);
      this.logger.log(`Stopped Azure VM: ${vmName}`);
    } catch (error) {
      this.logger.error(`Failed to stop Azure VM ${vmId}`, error);
      throw new Error(`Failed to stop Azure VM: ${error.message}`);
    }
  }

  /**
   * Deallocate (fully stop) a Virtual Machine
   */
  async deallocateVirtualMachine(credentials: AzureCredentials, vmId: string): Promise<void> {
    try {
      const { compute } = this.initializeClients(credentials);
      const resourceGroup = this.extractResourceGroup(vmId);
      const vmName = this.extractResourceName(vmId);

      await compute.virtualMachines.beginDeallocateAndWait(resourceGroup, vmName);
      this.logger.log(`Deallocated Azure VM: ${vmName}`);
    } catch (error) {
      this.logger.error(`Failed to deallocate Azure VM ${vmId}`, error);
      throw new Error(`Failed to deallocate Azure VM: ${error.message}`);
    }
  }

  /**
   * Helper: Extract resource group from Azure resource ID
   * Format: /subscriptions/{sub}/resourceGroups/{rg}/providers/{provider}/...
   */
  private extractResourceGroup(resourceId: string): string {
    const match = resourceId.match(/resourceGroups\/([^/]+)/);
    if (!match) {
      throw new Error('Invalid Azure resource ID format');
    }
    return match[1];
  }

  /**
   * Helper: Extract resource name from Azure resource ID
   */
  private extractResourceName(resourceId: string): string {
    const parts = resourceId.split('/');
    return parts[parts.length - 1];
  }
}

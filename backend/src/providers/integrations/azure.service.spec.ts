import { Test, TestingModule } from '@nestjs/testing';
import { AzureService } from './azure.service';

// Mock Azure SDK
jest.mock('@azure/identity');
jest.mock('@azure/arm-compute');
jest.mock('@azure/arm-storage');

describe('AzureService', () => {
  let service: AzureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AzureService],
    }).compile();

    service = module.get<AzureService>(AzureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('testConnection', () => {
    it('should test Azure connection successfully', async () => {
      const credentials = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        tenantId: 'test-tenant-id',
        subscriptionId: 'test-subscription-id',
      };

      // Mock the compute client
      const mockVirtualMachines = {
        listAll: jest.fn().mockReturnValue({
          next: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          [Symbol.asyncIterator]: function() {
            return this;
          },
        }),
      };

      const { ClientSecretCredential } = require('@azure/identity');
      const { ComputeManagementClient } = require('@azure/arm-compute');

      ComputeManagementClient.mockImplementation(() => ({
        virtualMachines: mockVirtualMachines,
      }));

      ClientSecretCredential.mockImplementation(() => ({}));

      const result = await service.testConnection(credentials);

      expect(result).toBe(true);
    });
  });

  describe('listVirtualMachines', () => {
    it('should list Azure VMs', async () => {
      const credentials = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        tenantId: 'test-tenant-id',
        subscriptionId: 'test-subscription-id',
      };

      const mockVM = {
        id: '/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Compute/virtualMachines/test-vm',
        name: 'test-vm',
        location: 'eastus',
        provisioningState: 'Succeeded',
        hardwareProfile: { vmSize: 'Standard_B1s' },
        storageProfile: {
          osDisk: { osType: 'Linux' },
        },
        tags: { environment: 'test' },
      };

      const mockVirtualMachines = {
        listAll: jest.fn().mockReturnValue({
          [Symbol.asyncIterator]: async function* () {
            yield mockVM;
          },
        }),
        instanceView: jest.fn().mockResolvedValue({
          statuses: [{ code: 'PowerState/running', displayStatus: 'VM running' }],
        }),
      };

      const { ClientSecretCredential } = require('@azure/identity');
      const { ComputeManagementClient } = require('@azure/arm-compute');

      ComputeManagementClient.mockImplementation(() => ({
        virtualMachines: mockVirtualMachines,
      }));

      ClientSecretCredential.mockImplementation(() => ({}));

      const result = await service.listVirtualMachines(credentials);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-vm');
      expect(result[0].type).toBe('vm');
      expect(result[0].region).toBe('eastus');
    });
  });

  describe('listStorageAccounts', () => {
    it('should list Azure Storage Accounts', async () => {
      const credentials = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        tenantId: 'test-tenant-id',
        subscriptionId: 'test-subscription-id',
      };

      const mockStorageAccount = {
        id: '/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/testsa',
        name: 'testsa',
        location: 'eastus',
        provisioningState: 'Succeeded',
        kind: 'StorageV2',
        sku: { name: 'Standard_LRS' },
        tags: {},
      };

      const mockStorageAccounts = {
        list: jest.fn().mockReturnValue({
          [Symbol.asyncIterator]: async function* () {
            yield mockStorageAccount;
          },
        }),
      };

      const { ClientSecretCredential } = require('@azure/identity');
      const { StorageManagementClient } = require('@azure/arm-storage');

      StorageManagementClient.mockImplementation(() => ({
        storageAccounts: mockStorageAccounts,
      }));

      ClientSecretCredential.mockImplementation(() => ({}));

      const result = await service.listStorageAccounts(credentials);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('testsa');
      expect(result[0].type).toBe('storage');
    });
  });

  describe('VM Management', () => {
    const credentials = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      tenantId: 'test-tenant-id',
      subscriptionId: 'test-subscription-id',
    };

    it('should start a VM', async () => {
      const mockVirtualMachines = {
        beginStartAndWait: jest.fn().mockResolvedValue({}),
      };

      const { ClientSecretCredential } = require('@azure/identity');
      const { ComputeManagementClient } = require('@azure/arm-compute');

      ComputeManagementClient.mockImplementation(() => ({
        virtualMachines: mockVirtualMachines,
      }));

      ClientSecretCredential.mockImplementation(() => ({}));

      const vmId =
        '/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Compute/virtualMachines/test-vm';

      await service.startVirtualMachine(credentials, vmId);

      expect(mockVirtualMachines.beginStartAndWait).toHaveBeenCalledWith('test-rg', 'test-vm');
    });

    it('should stop a VM', async () => {
      const mockVirtualMachines = {
        beginPowerOffAndWait: jest.fn().mockResolvedValue({}),
      };

      const { ClientSecretCredential } = require('@azure/identity');
      const { ComputeManagementClient } = require('@azure/arm-compute');

      ComputeManagementClient.mockImplementation(() => ({
        virtualMachines: mockVirtualMachines,
      }));

      ClientSecretCredential.mockImplementation(() => ({}));

      const vmId =
        '/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Compute/virtualMachines/test-vm';

      await service.stopVirtualMachine(credentials, vmId);

      expect(mockVirtualMachines.beginPowerOffAndWait).toHaveBeenCalledWith('test-rg', 'test-vm');
    });

    it('should deallocate a VM', async () => {
      const mockVirtualMachines = {
        beginDeallocateAndWait: jest.fn().mockResolvedValue({}),
      };

      const { ClientSecretCredential } = require('@azure/identity');
      const { ComputeManagementClient } = require('@azure/arm-compute');

      ComputeManagementClient.mockImplementation(() => ({
        virtualMachines: mockVirtualMachines,
      }));

      ClientSecretCredential.mockImplementation(() => ({}));

      const vmId =
        '/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Compute/virtualMachines/test-vm';

      await service.deallocateVirtualMachine(credentials, vmId);

      expect(mockVirtualMachines.beginDeallocateAndWait).toHaveBeenCalledWith(
        'test-rg',
        'test-vm',
      );
    });
  });
});

import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
}

export interface AWSResource {
  id: string;
  name: string;
  type: string;
  status: string;
  region: string;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

@Injectable()
export class AWSService {
  private readonly logger = new Logger(AWSService.name);

  /**
   * Initialize AWS SDK clients with credentials
   */
  private initializeClients(credentials: AWSCredentials) {
    AWS.config.update({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: credentials.region || 'us-east-1',
    });

    return {
      ec2: new AWS.EC2(),
      s3: new AWS.S3(),
      rds: new AWS.RDS(),
      lambda: new AWS.Lambda(),
      costExplorer: new AWS.CostExplorer({ region: 'us-east-1' }), // Cost Explorer is only in us-east-1
    };
  }

  /**
   * Test AWS credentials by making a simple API call
   */
  async testConnection(credentials: AWSCredentials): Promise<boolean> {
    try {
      const clients = this.initializeClients(credentials);
      await clients.ec2.describeRegions().promise();
      this.logger.log('AWS connection test successful');
      return true;
    } catch (error) {
      this.logger.error('AWS connection test failed', error);
      throw new Error(`AWS connection failed: ${error.message}`);
    }
  }

  /**
   * List all EC2 instances
   */
  async listEC2Instances(credentials: AWSCredentials): Promise<AWSResource[]> {
    try {
      const { ec2 } = this.initializeClients(credentials);
      const result = await ec2.describeInstances().promise();

      const instances: AWSResource[] = [];

      for (const reservation of result.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          const tags = this.convertTags(instance.Tags);

          instances.push({
            id: instance.InstanceId,
            name: tags.Name || instance.InstanceId,
            type: 'ec2',
            status: instance.State.Name,
            region: credentials.region || 'us-east-1',
            tags,
            metadata: {
              instanceType: instance.InstanceType,
              launchTime: instance.LaunchTime,
              availabilityZone: instance.Placement?.AvailabilityZone,
              platform: instance.Platform || 'linux',
              publicIp: instance.PublicIpAddress,
              privateIp: instance.PrivateIpAddress,
              vpcId: instance.VpcId,
              subnetId: instance.SubnetId,
              imageId: instance.ImageId,
            },
          });
        }
      }

      this.logger.log(`Found ${instances.length} EC2 instances`);
      return instances;
    } catch (error) {
      this.logger.error('Failed to list EC2 instances', error);
      throw new Error(`Failed to list EC2 instances: ${error.message}`);
    }
  }

  /**
   * List all S3 buckets
   */
  async listS3Buckets(credentials: AWSCredentials): Promise<AWSResource[]> {
    try {
      const { s3 } = this.initializeClients(credentials);
      const result = await s3.listBuckets().promise();

      const buckets: AWSResource[] = [];

      for (const bucket of result.Buckets || []) {
        try {
          // Get bucket location
          const location = await s3.getBucketLocation({ Bucket: bucket.Name }).promise();
          const region = location.LocationConstraint || 'us-east-1';

          // Get bucket tags
          let tags = {};
          try {
            const tagging = await s3.getBucketTagging({ Bucket: bucket.Name }).promise();
            tags = this.convertTags(tagging.TagSet);
          } catch {
            // Bucket might not have tags
          }

          buckets.push({
            id: bucket.Name,
            name: bucket.Name,
            type: 's3',
            status: 'active',
            region,
            tags,
            metadata: {
              creationDate: bucket.CreationDate,
            },
          });
        } catch (error) {
          this.logger.warn(`Failed to get details for bucket ${bucket.Name}`, error.message);
        }
      }

      this.logger.log(`Found ${buckets.length} S3 buckets`);
      return buckets;
    } catch (error) {
      this.logger.error('Failed to list S3 buckets', error);
      throw new Error(`Failed to list S3 buckets: ${error.message}`);
    }
  }

  /**
   * List all RDS instances
   */
  async listRDSInstances(credentials: AWSCredentials): Promise<AWSResource[]> {
    try {
      const { rds } = this.initializeClients(credentials);
      const result = await rds.describeDBInstances().promise();

      const instances: AWSResource[] = [];

      for (const instance of result.DBInstances || []) {
        const tags = this.convertTags(instance.TagList);

        instances.push({
          id: instance.DBInstanceIdentifier,
          name: instance.DBInstanceIdentifier,
          type: 'rds',
          status: instance.DBInstanceStatus,
          region: credentials.region || 'us-east-1',
          tags,
          metadata: {
            engine: instance.Engine,
            engineVersion: instance.EngineVersion,
            instanceClass: instance.DBInstanceClass,
            allocatedStorage: instance.AllocatedStorage,
            storageType: instance.StorageType,
            multiAZ: instance.MultiAZ,
            availabilityZone: instance.AvailabilityZone,
            endpoint: instance.Endpoint?.Address,
            port: instance.Endpoint?.Port,
            createdTime: instance.InstanceCreateTime,
          },
        });
      }

      this.logger.log(`Found ${instances.length} RDS instances`);
      return instances;
    } catch (error) {
      this.logger.error('Failed to list RDS instances', error);
      throw new Error(`Failed to list RDS instances: ${error.message}`);
    }
  }

  /**
   * List all Lambda functions
   */
  async listLambdaFunctions(credentials: AWSCredentials): Promise<AWSResource[]> {
    try {
      const { lambda } = this.initializeClients(credentials);
      const result = await lambda.listFunctions().promise();

      const functions: AWSResource[] = [];

      for (const func of result.Functions || []) {
        // Get function tags
        let tags = {};
        try {
          const tagging = await lambda.listTags({ Resource: func.FunctionArn }).promise();
          tags = tagging.Tags || {};
        } catch {
          // Function might not have tags
        }

        functions.push({
          id: func.FunctionArn,
          name: func.FunctionName,
          type: 'lambda',
          status: func.State || 'Active',
          region: credentials.region || 'us-east-1',
          tags,
          metadata: {
            runtime: func.Runtime,
            handler: func.Handler,
            codeSize: func.CodeSize,
            timeout: func.Timeout,
            memorySize: func.MemorySize,
            lastModified: func.LastModified,
            description: func.Description,
          },
        });
      }

      this.logger.log(`Found ${functions.length} Lambda functions`);
      return functions;
    } catch (error) {
      this.logger.error('Failed to list Lambda functions', error);
      throw new Error(`Failed to list Lambda functions: ${error.message}`);
    }
  }

  /**
   * Get all resources across all AWS services
   */
  async getAllResources(credentials: AWSCredentials): Promise<AWSResource[]> {
    try {
      const [ec2Instances, s3Buckets, rdsInstances, lambdaFunctions] = await Promise.all([
        this.listEC2Instances(credentials),
        this.listS3Buckets(credentials),
        this.listRDSInstances(credentials),
        this.listLambdaFunctions(credentials),
      ]);

      const allResources = [...ec2Instances, ...s3Buckets, ...rdsInstances, ...lambdaFunctions];
      this.logger.log(`Total AWS resources found: ${allResources.length}`);

      return allResources;
    } catch (error) {
      this.logger.error('Failed to get all AWS resources', error);
      throw error;
    }
  }

  /**
   * Get cost data for the organization
   */
  async getCostData(
    credentials: AWSCredentials,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    try {
      const { costExplorer } = this.initializeClients(credentials);

      const params = {
        TimePeriod: {
          Start: startDate,
          End: endDate,
        },
        Granularity: 'MONTHLY',
        Metrics: ['UnblendedCost', 'UsageQuantity'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE',
          },
        ],
      };

      const result = await costExplorer.getCostAndUsage(params).promise();

      const costData = {
        totalCost: 0,
        currency: 'USD',
        period: {
          start: startDate,
          end: endDate,
        },
        byService: [] as any[],
      };

      for (const resultByTime of result.ResultsByTime || []) {
        for (const group of resultByTime.Groups || []) {
          const serviceName = group.Keys?.[0] || 'Unknown';
          const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
          const usage = parseFloat(group.Metrics?.UsageQuantity?.Amount || '0');

          costData.totalCost += cost;
          costData.byService.push({
            service: serviceName,
            cost,
            usage,
            unit: group.Metrics?.UnblendedCost?.Unit || 'USD',
          });
        }
      }

      this.logger.log(`Retrieved cost data: $${costData.totalCost.toFixed(2)}`);
      return costData;
    } catch (error) {
      this.logger.error('Failed to get cost data', error);
      throw new Error(`Failed to get cost data: ${error.message}`);
    }
  }

  /**
   * Start an EC2 instance
   */
  async startEC2Instance(credentials: AWSCredentials, instanceId: string): Promise<void> {
    try {
      const { ec2 } = this.initializeClients(credentials);
      await ec2.startInstances({ InstanceIds: [instanceId] }).promise();
      this.logger.log(`Started EC2 instance: ${instanceId}`);
    } catch (error) {
      this.logger.error(`Failed to start EC2 instance ${instanceId}`, error);
      throw new Error(`Failed to start EC2 instance: ${error.message}`);
    }
  }

  /**
   * Stop an EC2 instance
   */
  async stopEC2Instance(credentials: AWSCredentials, instanceId: string): Promise<void> {
    try {
      const { ec2 } = this.initializeClients(credentials);
      await ec2.stopInstances({ InstanceIds: [instanceId] }).promise();
      this.logger.log(`Stopped EC2 instance: ${instanceId}`);
    } catch (error) {
      this.logger.error(`Failed to stop EC2 instance ${instanceId}`, error);
      throw new Error(`Failed to stop EC2 instance: ${error.message}`);
    }
  }

  /**
   * Terminate an EC2 instance
   */
  async terminateEC2Instance(credentials: AWSCredentials, instanceId: string): Promise<void> {
    try {
      const { ec2 } = this.initializeClients(credentials);
      await ec2.terminateInstances({ InstanceIds: [instanceId] }).promise();
      this.logger.log(`Terminated EC2 instance: ${instanceId}`);
    } catch (error) {
      this.logger.error(`Failed to terminate EC2 instance ${instanceId}`, error);
      throw new Error(`Failed to terminate EC2 instance: ${error.message}`);
    }
  }

  /**
   * Helper: Convert AWS tag format to simple key-value object
   */
  private convertTags(tags?: Array<{ Key?: string; Value?: string }>): Record<string, string> {
    if (!tags || tags.length === 0) return {};

    const result: Record<string, string> = {};
    for (const tag of tags) {
      if (tag.Key) {
        result[tag.Key] = tag.Value || '';
      }
    }
    return result;
  }
}

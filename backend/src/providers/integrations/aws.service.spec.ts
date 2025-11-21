import { Test, TestingModule } from '@nestjs/testing';
import { AWSService } from './aws.service';
import * as AWS from 'aws-sdk';

// Mock AWS SDK
jest.mock('aws-sdk');

describe('AWSService', () => {
  let service: AWSService;
  let mockEC2: jest.Mocked<AWS.EC2>;
  let mockS3: jest.Mocked<AWS.S3>;
  let mockRDS: jest.Mocked<AWS.RDS>;
  let mockLambda: jest.Mocked<AWS.Lambda>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AWSService],
    }).compile();

    service = module.get<AWSService>(AWSService);

    // Setup mocks
    mockEC2 = {
      describeRegions: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Regions: [] }),
      }),
      describeInstances: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Reservations: [] }),
      }),
      startInstances: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      }),
      stopInstances: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      }),
      terminateInstances: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      }),
    } as any;

    mockS3 = {
      listBuckets: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Buckets: [] }),
      }),
      getBucketLocation: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({ LocationConstraint: 'us-east-1' }),
      }),
      getBucketTagging: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({ TagSet: [] }),
      }),
    } as any;

    mockRDS = {
      describeDBInstances: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({ DBInstances: [] }),
      }),
    } as any;

    mockLambda = {
      listFunctions: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Functions: [] }),
      }),
      listTags: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Tags: {} }),
      }),
    } as any;

    // Mock AWS constructors
    (AWS.EC2 as any) = jest.fn(() => mockEC2);
    (AWS.S3 as any) = jest.fn(() => mockS3);
    (AWS.RDS as any) = jest.fn(() => mockRDS);
    (AWS.Lambda as any) = jest.fn(() => mockLambda);
    (AWS.CostExplorer as any) = jest.fn(() => ({}));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('testConnection', () => {
    it('should test AWS connection successfully', async () => {
      const credentials = {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        region: 'us-east-1',
      };

      const result = await service.testConnection(credentials);

      expect(result).toBe(true);
      expect(mockEC2.describeRegions).toHaveBeenCalled();
    });

    it('should throw error on connection failure', async () => {
      const credentials = {
        accessKeyId: 'invalid-key',
        secretAccessKey: 'invalid-secret',
        region: 'us-east-1',
      };

      mockEC2.describeRegions = jest.fn().mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Invalid credentials')),
      });

      await expect(service.testConnection(credentials)).rejects.toThrow('AWS connection failed');
    });
  });

  describe('listEC2Instances', () => {
    it('should list EC2 instances', async () => {
      const mockInstances = {
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-1234567890abcdef0',
                InstanceType: 't2.micro',
                State: { Name: 'running' },
                Tags: [{ Key: 'Name', Value: 'Test Instance' }],
                LaunchTime: new Date(),
                Placement: { AvailabilityZone: 'us-east-1a' },
              },
            ],
          },
        ],
      };

      mockEC2.describeInstances = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue(mockInstances),
      });

      const credentials = {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        region: 'us-east-1',
      };

      const result = await service.listEC2Instances(credentials);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('i-1234567890abcdef0');
      expect(result[0].name).toBe('Test Instance');
      expect(result[0].type).toBe('ec2');
      expect(result[0].status).toBe('running');
    });

    it('should handle empty instances list', async () => {
      const credentials = {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        region: 'us-east-1',
      };

      const result = await service.listEC2Instances(credentials);

      expect(result).toHaveLength(0);
    });
  });

  describe('listS3Buckets', () => {
    it('should list S3 buckets', async () => {
      const mockBuckets = {
        Buckets: [
          {
            Name: 'test-bucket',
            CreationDate: new Date(),
          },
        ],
      };

      mockS3.listBuckets = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue(mockBuckets),
      });

      const credentials = {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        region: 'us-east-1',
      };

      const result = await service.listS3Buckets(credentials);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-bucket');
      expect(result[0].type).toBe('s3');
      expect(result[0].status).toBe('active');
    });
  });

  describe('listRDSInstances', () => {
    it('should list RDS instances', async () => {
      const mockDBInstances = {
        DBInstances: [
          {
            DBInstanceIdentifier: 'test-db',
            DBInstanceStatus: 'available',
            Engine: 'postgres',
            EngineVersion: '13.7',
            DBInstanceClass: 'db.t3.micro',
            AllocatedStorage: 20,
            TagList: [],
          },
        ],
      };

      mockRDS.describeDBInstances = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue(mockDBInstances),
      });

      const credentials = {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        region: 'us-east-1',
      };

      const result = await service.listRDSInstances(credentials);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-db');
      expect(result[0].type).toBe('rds');
      expect(result[0].status).toBe('available');
      expect(result[0].metadata.engine).toBe('postgres');
    });
  });

  describe('listLambdaFunctions', () => {
    it('should list Lambda functions', async () => {
      const mockFunctions = {
        Functions: [
          {
            FunctionName: 'test-function',
            FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
            Runtime: 'nodejs18.x',
            Handler: 'index.handler',
            State: 'Active',
            CodeSize: 1024,
            Timeout: 30,
            MemorySize: 128,
          },
        ],
      };

      mockLambda.listFunctions = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue(mockFunctions),
      });

      const credentials = {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        region: 'us-east-1',
      };

      const result = await service.listLambdaFunctions(credentials);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-function');
      expect(result[0].type).toBe('lambda');
      expect(result[0].metadata.runtime).toBe('nodejs18.x');
    });
  });

  describe('getAllResources', () => {
    it('should aggregate all resource types', async () => {
      const credentials = {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        region: 'us-east-1',
      };

      // Setup mocks to return one resource of each type
      mockEC2.describeInstances = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Reservations: [
            {
              Instances: [
                {
                  InstanceId: 'i-123',
                  State: { Name: 'running' },
                  Tags: [],
                  Placement: {},
                },
              ],
            },
          ],
        }),
      });

      mockS3.listBuckets = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Buckets: [{ Name: 'bucket-1', CreationDate: new Date() }],
        }),
      });

      const result = await service.getAllResources(credentials);

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('EC2 Instance Management', () => {
    const credentials = {
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
      region: 'us-east-1',
    };

    it('should start an EC2 instance', async () => {
      await service.startEC2Instance(credentials, 'i-123');
      expect(mockEC2.startInstances).toHaveBeenCalledWith({ InstanceIds: ['i-123'] });
    });

    it('should stop an EC2 instance', async () => {
      await service.stopEC2Instance(credentials, 'i-123');
      expect(mockEC2.stopInstances).toHaveBeenCalledWith({ InstanceIds: ['i-123'] });
    });

    it('should terminate an EC2 instance', async () => {
      await service.terminateEC2Instance(credentials, 'i-123');
      expect(mockEC2.terminateInstances).toHaveBeenCalledWith({ InstanceIds: ['i-123'] });
    });
  });
});

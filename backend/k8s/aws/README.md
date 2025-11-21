# AWS EKS Deployment Guide

Complete guide for deploying Almonds backend on Amazon Elastic Kubernetes Service (EKS).

## Prerequisites

- AWS CLI configured with appropriate credentials
- kubectl installed and configured
- eksctl installed
- Helm 3.x installed
- Docker for building images

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Internet                              │
└────────────────┬────────────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │  Route 53 DNS  │
         └───────┬────────┘
                 │
    ┌────────────▼──────────────┐
    │  Application Load         │
    │  Balancer (ALB)           │
    │  - WAF (optional)         │
    │  - Shield (optional)      │
    └────────────┬──────────────┘
                 │
    ┌────────────▼──────────────┐
    │   EKS Cluster             │
    │  ┌──────────────────┐     │
    │  │  Almonds API     │     │
    │  │  (3+ pods)       │     │
    │  │  - Auto-scaling  │     │
    │  │  - Multi-AZ      │     │
    │  └────┬─────┬───────┘     │
    │       │     │              │
    │  ┌────▼─────▼──────┐      │
    │  │  RDS PostgreSQL  │      │
    │  │  (Multi-AZ)      │      │
    │  └──────────────────┘      │
    │                             │
    │  ┌──────────────────┐      │
    │  │  ElastiCache     │      │
    │  │  Redis           │      │
    │  └──────────────────┘      │
    └─────────────────────────────┘
```

## Step 1: Create EKS Cluster

```bash
# Create cluster with eksctl
eksctl create cluster \
  --name almonds-production \
  --region us-east-1 \
  --version 1.28 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 3 \
  --nodes-max 10 \
  --managed \
  --with-oidc

# Verify cluster
kubectl get nodes
```

### Alternative: Using Terraform

```hcl
# See terraform/ directory for complete EKS setup
terraform init
terraform plan
terraform apply
```

## Step 2: Install Required Add-ons

### AWS Load Balancer Controller

```bash
# Add IAM policy
curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.6.0/docs/install/iam_policy.json

aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json

# Create IAM service account
eksctl create iamserviceaccount \
  --cluster=almonds-production \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve

# Install controller via Helm
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=almonds-production \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

### Cluster Autoscaler

```bash
# Create IAM policy for autoscaler
cat > cluster-autoscaler-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "autoscaling:DescribeAutoScalingGroups",
        "autoscaling:DescribeAutoScalingInstances",
        "autoscaling:DescribeLaunchConfigurations",
        "autoscaling:SetDesiredCapacity",
        "autoscaling:TerminateInstanceInAutoScalingGroup",
        "ec2:DescribeLaunchTemplateVersions"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam create-policy \
  --policy-name ClusterAutoscalerPolicy \
  --policy-document file://cluster-autoscaler-policy.json

# Create service account
eksctl create iamserviceaccount \
  --cluster=almonds-production \
  --namespace=kube-system \
  --name=cluster-autoscaler \
  --attach-policy-arn=arn:aws:iam::ACCOUNT_ID:policy/ClusterAutoscalerPolicy \
  --approve

# Deploy autoscaler
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml
```

### EBS CSI Driver (for persistent volumes)

```bash
eksctl create iamserviceaccount \
  --name ebs-csi-controller-sa \
  --namespace kube-system \
  --cluster almonds-production \
  --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
  --approve \
  --role-only \
  --role-name AmazonEKS_EBS_CSI_DriverRole

# Install CSI driver
kubectl apply -k "github.com/kubernetes-sigs/aws-ebs-csi-driver/deploy/kubernetes/overlays/stable/?ref=release-1.25"
```

## Step 3: Create RDS PostgreSQL Database

```bash
# Via AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier almonds-production \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username almonds \
  --master-user-password SECURE_PASSWORD \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --multi-az \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name almonds-db-subnet-group \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --enable-cloudwatch-logs-exports '["postgresql"]' \
  --tags Key=Application,Value=Almonds Key=Environment,Value=Production
```

## Step 4: Create ElastiCache Redis

```bash
aws elasticache create-replication-group \
  --replication-group-id almonds-redis \
  --replication-group-description "Almonds Redis cluster" \
  --engine redis \
  --engine-version 7.0 \
  --cache-node-type cache.t3.medium \
  --num-cache-clusters 2 \
  --automatic-failover-enabled \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled \
  --auth-token SECURE_AUTH_TOKEN \
  --cache-subnet-group-name almonds-redis-subnet-group \
  --security-group-ids sg-xxxxx \
  --snapshot-retention-limit 5 \
  --snapshot-window "03:00-05:00" \
  --tags Key=Application,Value=Almonds Key=Environment,Value=Production
```

## Step 5: Create ECR Repository

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name almonds-api \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push image
docker build -t almonds-api:latest ../../
docker tag almonds-api:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/almonds-api:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/almonds-api:latest
```

## Step 6: Create IAM Role for Service Account

```bash
# Create IAM policy for application
cat > almonds-api-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:almonds/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::almonds-uploads/*",
        "arn:aws:s3:::almonds-backups/*"
      ]
    }
  ]
}
EOF

aws iam create-policy \
  --policy-name AlmondsAPIPolicy \
  --policy-document file://almonds-api-policy.json

# Create service account with IAM role
eksctl create iamserviceaccount \
  --name almonds-api \
  --namespace default \
  --cluster almonds-production \
  --attach-policy-arn arn:aws:iam::ACCOUNT_ID:policy/AlmondsAPIPolicy \
  --approve
```

## Step 7: Store Secrets in AWS Secrets Manager

```bash
# Create secrets
aws secretsmanager create-secret \
  --name almonds/database-url \
  --secret-string "postgresql://almonds:PASSWORD@almonds-production.xxxxx.us-east-1.rds.amazonaws.com:5432/almonds"

aws secretsmanager create-secret \
  --name almonds/jwt-secret \
  --secret-string "$(openssl rand -hex 32)"

aws secretsmanager create-secret \
  --name almonds/stripe-secret-key \
  --secret-string "sk_live_xxxxx"

# Or create all secrets at once in JSON format
cat > secrets.json <<EOF
{
  "database-url": "postgresql://...",
  "redis-password": "...",
  "jwt-secret": "...",
  "stripe-secret-key": "...",
  "sendgrid-api-key": "..."
}
EOF

# Use External Secrets Operator to sync from Secrets Manager to Kubernetes
kubectl apply -f external-secrets-operator.yaml
```

## Step 8: Deploy Application

```bash
# Update configuration files with your values
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=us-east-1
export CERTIFICATE_ID=xxxxx-xxxxx-xxxxx
export ALB_SECURITY_GROUP_ID=sg-xxxxx

# Replace placeholders in manifests
envsubst < alb-ingress.yaml | kubectl apply -f -
envsubst < eks-deployment.yaml | kubectl apply -f -

# Apply base configuration
kubectl apply -f ../base/configmap.yaml
kubectl apply -f ../base/service.yaml
kubectl apply -f ../base/pdb.yaml
kubectl apply -f ../base/network-policy.yaml

# Verify deployment
kubectl get pods
kubectl get svc
kubectl get ingress
```

## Step 9: Configure DNS

```bash
# Get ALB DNS name
ALB_DNS=$(kubectl get ingress almonds-api-alb -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Create Route 53 record
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.almonds.io",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "'$ALB_DNS'",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

## Step 10: Configure Monitoring

```bash
# Install Prometheus and Grafana
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# Configure CloudWatch Container Insights
eksctl create iamserviceaccount \
  --cluster almonds-production \
  --namespace amazon-cloudwatch \
  --name cloudwatch-agent \
  --attach-policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy \
  --approve

kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluentd-quickstart.yaml
```

## Maintenance

### Update Application

```bash
# Build and push new image
docker build -t ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/almonds-api:v1.1.0 ../../
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/almonds-api:v1.1.0

# Update deployment
kubectl set image deployment/almonds-api almonds-api=ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/almonds-api:v1.1.0

# Monitor rollout
kubectl rollout status deployment/almonds-api
```

### Database Migrations

```bash
# Run migrations in a job
kubectl run migrations \
  --image=ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/almonds-api:latest \
  --restart=Never \
  --env="DATABASE_URL=$(kubectl get secret almonds-secrets -o jsonpath='{.data.database-url}' | base64 -d)" \
  -- npm run migrate:deploy
```

### Backup and Recovery

```bash
# RDS automated backups are already configured
# To create manual snapshot:
aws rds create-db-snapshot \
  --db-instance-identifier almonds-production \
  --db-snapshot-identifier almonds-$(date +%Y%m%d-%H%M%S)

# Restore from snapshot:
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier almonds-restored \
  --db-snapshot-identifier almonds-20240101-120000
```

## Cost Optimization

1. **Use Spot Instances** for non-critical workloads
2. **Enable cluster autoscaling** to scale down during low traffic
3. **Use RDS Reserved Instances** for production database
4. **Configure S3 lifecycle policies** for old backups
5. **Use ElastiCache Reserved Nodes** for production Redis

## Security Checklist

- [ ] Enable VPC Flow Logs
- [ ] Configure Security Groups with least privilege
- [ ] Enable RDS encryption at rest
- [ ] Enable ElastiCache encryption in transit
- [ ] Use AWS Secrets Manager for secrets
- [ ] Enable ALB access logs
- [ ] Configure WAF rules
- [ ] Enable AWS Shield for DDoS protection
- [ ] Use IAM roles instead of access keys
- [ ] Enable CloudTrail for audit logging
- [ ] Configure network policies in Kubernetes
- [ ] Use Pod Security Standards

## Troubleshooting

### Pods not starting

```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

### Cannot connect to RDS

```bash
# Verify security group allows traffic from EKS node security group
aws rds describe-db-instances --db-instance-identifier almonds-production

# Test connection from pod
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- psql $DATABASE_URL
```

### ALB not created

```bash
# Check controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify ingress events
kubectl describe ingress almonds-api-alb
```

## Resources

- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Amazon RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [ElastiCache Best Practices](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/BestPractices.html)

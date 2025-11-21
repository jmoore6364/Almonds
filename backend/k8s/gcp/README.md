# GCP GKE Deployment Guide

Complete guide for deploying Almonds backend on Google Kubernetes Engine (GKE).

## Prerequisites

- Google Cloud SDK (gcloud) installed and authenticated
- kubectl installed and configured
- Helm 3.x installed
- Docker for building images

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Internet                              │
└────────────────┬────────────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │  Cloud DNS     │
         └───────┬────────┘
                 │
    ┌────────────▼──────────────┐
    │  Cloud Load Balancer      │
    │  - Global HTTPS LB        │
    │  - Cloud Armor            │
    │  - Managed SSL            │
    └────────────┬──────────────┘
                 │
    ┌────────────▼──────────────┐
    │   GKE Cluster             │
    │  ┌──────────────────┐     │
    │  │  Almonds API     │     │
    │  │  (3+ pods)       │     │
    │  │  - Auto-scaling  │     │
    │  │  - Multi-zone    │     │
    │  └────┬─────┬───────┘     │
    │       │     │              │
    │  ┌────▼─────▼──────┐      │
    │  │  Cloud SQL       │      │
    │  │  PostgreSQL      │      │
    │  │  (HA)            │      │
    │  └──────────────────┘      │
    │                             │
    │  ┌──────────────────┐      │
    │  │  Memorystore     │      │
    │  │  Redis           │      │
    │  └──────────────────┘      │
    └─────────────────────────────┘
```

## Step 1: Set Up GCP Project

```bash
# Set variables
PROJECT_ID="almonds-production"
REGION="us-central1"
ZONE="us-central1-a"
CLUSTER_NAME="almonds-gke"

# Set project
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  container.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  compute.googleapis.com \
  cloudresourcemanager.googleapis.com \
  servicenetworking.googleapis.com \
  secretmanager.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com
```

## Step 2: Create GKE Cluster

```bash
# Create GKE cluster with best practices
gcloud container clusters create $CLUSTER_NAME \
  --region $REGION \
  --node-locations $REGION-a,$REGION-b,$REGION-c \
  --num-nodes 1 \
  --machine-type n1-standard-2 \
  --disk-type pd-standard \
  --disk-size 100 \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 10 \
  --enable-autorepair \
  --enable-autoupgrade \
  --enable-ip-alias \
  --enable-cloud-logging \
  --enable-cloud-monitoring \
  --enable-stackdriver-kubernetes \
  --addons HorizontalPodAutoscaling,HttpLoadBalancing,GcePersistentDiskCsiDriver \
  --workload-pool=$PROJECT_ID.svc.id.goog \
  --enable-shielded-nodes \
  --shielded-secure-boot \
  --shielded-integrity-monitoring \
  --release-channel regular \
  --network default \
  --subnetwork default

# Get credentials
gcloud container clusters get-credentials $CLUSTER_NAME --region $REGION

# Verify cluster
kubectl get nodes
```

### Alternative: Using Autopilot (Fully Managed)

```bash
# Create GKE Autopilot cluster (recommended for production)
gcloud container clusters create-auto $CLUSTER_NAME \
  --region $REGION \
  --release-channel regular \
  --enable-master-authorized-networks \
  --master-authorized-networks 0.0.0.0/0
```

## Step 3: Create Container Registry

```bash
# Enable Artifact Registry (recommended) or Container Registry
gcloud services enable artifactregistry.googleapis.com

# Create Artifact Registry repository
gcloud artifacts repositories create almonds-docker \
  --repository-format=docker \
  --location=$REGION \
  --description="Almonds container images"

# Configure Docker authentication
gcloud auth configure-docker $REGION-docker.pkg.dev

# Build and push image
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/almonds-docker/almonds-api:latest ../../
docker push $REGION-docker.pkg.dev/$PROJECT_ID/almonds-docker/almonds-api:latest

# Alternative: Use Cloud Build for building
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/almonds-docker/almonds-api:latest ../../
```

## Step 4: Create Cloud SQL PostgreSQL

```bash
INSTANCE_NAME="almonds-db"
DATABASE_VERSION="POSTGRES_15"

# Create Cloud SQL instance with high availability
gcloud sql instances create $INSTANCE_NAME \
  --database-version=$DATABASE_VERSION \
  --tier=db-n1-standard-2 \
  --region=$REGION \
  --network=default \
  --enable-bin-log \
  --backup \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04 \
  --availability-type=REGIONAL \
  --storage-type=SSD \
  --storage-size=100GB \
  --storage-auto-increase \
  --labels=env=production,app=almonds

# Set root password
gcloud sql users set-password postgres \
  --instance=$INSTANCE_NAME \
  --password=SECURE_PASSWORD

# Create database
gcloud sql databases create almonds \
  --instance=$INSTANCE_NAME

# Create application user
gcloud sql users create almonds \
  --instance=$INSTANCE_NAME \
  --password=SECURE_APP_PASSWORD

# Get connection name
gcloud sql instances describe $INSTANCE_NAME \
  --format="value(connectionName)"
```

## Step 5: Create Memorystore Redis

```bash
REDIS_INSTANCE_NAME="almonds-redis"

# Create Memorystore Redis instance
gcloud redis instances create $REDIS_INSTANCE_NAME \
  --region=$REGION \
  --tier=standard \
  --size=1 \
  --redis-version=redis_7_0 \
  --network=default \
  --transit-encryption-mode=SERVER_AUTHENTICATION \
  --labels=env=production,app=almonds

# Get Redis host and port
gcloud redis instances describe $REDIS_INSTANCE_NAME \
  --region=$REGION \
  --format="value(host,port)"

# Get Redis auth string
gcloud redis instances get-auth-string $REDIS_INSTANCE_NAME \
  --region=$REGION
```

## Step 6: Configure Workload Identity

```bash
# Enable Workload Identity on cluster (if not already enabled)
gcloud container clusters update $CLUSTER_NAME \
  --region=$REGION \
  --workload-pool=$PROJECT_ID.svc.id.goog

# Create Google Service Account
GSA_NAME="almonds-api-sa"
gcloud iam service-accounts create $GSA_NAME \
  --display-name="Almonds API Service Account"

# Grant permissions to GSA
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$GSA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$GSA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$GSA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Create Kubernetes Service Account
kubectl create serviceaccount almonds-api --namespace default

# Bind KSA to GSA
gcloud iam service-accounts add-iam-policy-binding \
  $GSA_NAME@$PROJECT_ID.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:$PROJECT_ID.svc.id.goog[default/almonds-api]"

# Annotate KSA
kubectl annotate serviceaccount almonds-api \
  --namespace default \
  iam.gke.io/gcp-service-account=$GSA_NAME@$PROJECT_ID.iam.gserviceaccount.com
```

## Step 7: Store Secrets in Secret Manager

```bash
# Create secrets
echo -n "postgresql://almonds:PASSWORD@/almonds?host=/cloudsql/$PROJECT_ID:$REGION:$INSTANCE_NAME" | \
  gcloud secrets create database-url --data-file=-

echo -n "$(openssl rand -hex 32)" | \
  gcloud secrets create jwt-secret --data-file=-

echo -n "sk_live_xxxxx" | \
  gcloud secrets create stripe-secret-key --data-file=-

echo -n "SG.xxxxx" | \
  gcloud secrets create sendgrid-api-key --data-file=-

# Grant GSA access to secrets
for secret in database-url jwt-secret stripe-secret-key sendgrid-api-key; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:$GSA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

## Step 8: Reserve Static IP

```bash
# Reserve global static IP for load balancer
gcloud compute addresses create almonds-api-ip \
  --global \
  --ip-version IPV4

# Get the IP address
gcloud compute addresses describe almonds-api-ip \
  --global \
  --format="value(address)"
```

## Step 9: Configure Cloud Armor Security Policy

```bash
# Create security policy
gcloud compute security-policies create almonds-security-policy \
  --description "Almonds API security policy"

# Add rate limiting rule
gcloud compute security-policies rules create 1000 \
  --security-policy almonds-security-policy \
  --expression "true" \
  --action "rate-based-ban" \
  --rate-limit-threshold-count 100 \
  --rate-limit-threshold-interval-sec 60 \
  --ban-duration-sec 600 \
  --conform-action allow \
  --exceed-action deny-429 \
  --enforce-on-key IP

# Add geo-blocking rule (optional - block specific countries)
# gcloud compute security-policies rules create 2000 \
#   --security-policy almonds-security-policy \
#   --expression "origin.region_code == 'CN' || origin.region_code == 'RU'" \
#   --action deny-403

# Add SQL injection protection
gcloud compute security-policies rules create 3000 \
  --security-policy almonds-security-policy \
  --expression "evaluatePreconfiguredExpr('sqli-stable')" \
  --action deny-403

# Add XSS protection
gcloud compute security-policies rules create 4000 \
  --security-policy almonds-security-policy \
  --expression "evaluatePreconfiguredExpr('xss-stable')" \
  --action deny-403
```

## Step 10: Deploy Application

```bash
# Update configuration files with your values
export PROJECT_ID="almonds-production"
export GCP_REGION="us-central1"

# Replace placeholders in manifests
envsubst < gke-deployment.yaml | kubectl apply -f -
envsubst < gclb-ingress.yaml | kubectl apply -f -

# Apply base configuration
kubectl apply -f ../base/configmap.yaml
kubectl apply -f ../base/service.yaml
kubectl apply -f ../base/pdb.yaml
kubectl apply -f ../base/network-policy.yaml

# Verify deployment
kubectl get pods
kubectl get svc
kubectl get ingress

# Wait for load balancer to be provisioned (can take 5-10 minutes)
kubectl describe ingress almonds-api-gclb
```

## Step 11: Configure DNS

```bash
# Get load balancer IP
LB_IP=$(gcloud compute addresses describe almonds-api-ip \
  --global \
  --format="value(address)")

# Create Cloud DNS managed zone (if not exists)
gcloud dns managed-zones create almonds-io \
  --dns-name=almonds.io \
  --description="Almonds DNS zone"

# Add A record
gcloud dns record-sets transaction start --zone=almonds-io
gcloud dns record-sets transaction add $LB_IP \
  --name=api.almonds.io. \
  --ttl=300 \
  --type=A \
  --zone=almonds-io
gcloud dns record-sets transaction execute --zone=almonds-io
```

## Step 12: Configure Monitoring

```bash
# GKE monitoring is already enabled
# Access via Google Cloud Console > Monitoring > Dashboards

# Install Prometheus and Grafana (optional, in addition to Cloud Monitoring)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# Create custom dashboard in Cloud Monitoring
gcloud monitoring dashboards create --config-from-file=monitoring-dashboard.json
```

## Maintenance

### Update Application

```bash
# Build and push new image
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/almonds-docker/almonds-api:v1.1.0 ../../

# Update deployment
kubectl set image deployment/almonds-api almonds-api=$REGION-docker.pkg.dev/$PROJECT_ID/almonds-docker/almonds-api:v1.1.0

# Monitor rollout
kubectl rollout status deployment/almonds-api
```

### Database Migrations

```bash
# Run migrations in a Cloud SQL Proxy job
kubectl run migrations \
  --image=$REGION-docker.pkg.dev/$PROJECT_ID/almonds-docker/almonds-api:latest \
  --restart=Never \
  --env="DATABASE_URL=$(gcloud secrets versions access latest --secret=database-url)" \
  -- npm run migrate:deploy
```

### Backup and Recovery

```bash
# Cloud SQL has automated backups enabled
# To create on-demand backup:
gcloud sql backups create \
  --instance=$INSTANCE_NAME \
  --description="Manual backup $(date +%Y%m%d)"

# List backups
gcloud sql backups list --instance=$INSTANCE_NAME

# Restore from backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=$INSTANCE_NAME \
  --backup-id=BACKUP_ID
```

## Cost Optimization

1. **Use Preemptible VMs** for non-critical node pools
2. **Enable cluster autoscaling** to scale down during low traffic
3. **Use Committed Use Discounts** for GKE and Cloud SQL
4. **Configure Cloud Storage lifecycle policies** for old backups
5. **Use GKE Autopilot** for automatic resource optimization
6. **Enable Binary Authorization** to prevent unauthorized deployments

## Security Checklist

- [ ] Enable VPC-native cluster (IP aliasing)
- [ ] Configure authorized networks for GKE master
- [ ] Enable shielded GKE nodes
- [ ] Use private GKE cluster
- [ ] Enable Cloud SQL SSL
- [ ] Enable Memorystore in-transit encryption
- [ ] Use Secret Manager for secrets
- [ ] Enable Cloud Armor security policies
- [ ] Configure Workload Identity
- [ ] Enable Binary Authorization
- [ ] Configure Pod Security Policies
- [ ] Enable Cloud Audit Logs
- [ ] Use VPC Service Controls

## Troubleshooting

### Pods not starting

```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl logs <pod-name> -c cloud-sql-proxy
```

### Cannot connect to Cloud SQL

```bash
# Verify Cloud SQL Proxy is running
kubectl logs <pod-name> -c cloud-sql-proxy

# Test connection from Cloud Shell
gcloud sql connect $INSTANCE_NAME --user=almonds

# Verify Workload Identity is configured
kubectl describe sa almonds-api
```

### Load Balancer not provisioning

```bash
# Check ingress events
kubectl describe ingress almonds-api-gclb

# Verify backend services
gcloud compute backend-services list

# Check health checks
gcloud compute health-checks list
```

### High Cloud Costs

```bash
# Analyze costs with Cloud Billing reports
gcloud billing accounts list
gcloud beta billing budgets list

# Use Cloud Cost Management tools
# Visit: https://console.cloud.google.com/billing/cost-management
```

## Resources

- [GKE Documentation](https://cloud.google.com/kubernetes-engine/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Memorystore Documentation](https://cloud.google.com/memorystore/docs/redis)
- [Cloud Load Balancing](https://cloud.google.com/load-balancing/docs)
- [Cloud Armor](https://cloud.google.com/armor/docs)
- [Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)

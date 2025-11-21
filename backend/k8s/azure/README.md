# Azure AKS Deployment Guide

Complete guide for deploying Almonds backend on Azure Kubernetes Service (AKS).

## Prerequisites

- Azure CLI installed and authenticated
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
         │  Azure DNS     │
         └───────┬────────┘
                 │
    ┌────────────▼──────────────┐
    │  Application Gateway      │
    │  - WAF enabled            │
    │  - SSL termination        │
    │  - Auto-scaling           │
    └────────────┬──────────────┘
                 │
    ┌────────────▼──────────────┐
    │   AKS Cluster             │
    │  ┌──────────────────┐     │
    │  │  Almonds API     │     │
    │  │  (3+ pods)       │     │
    │  │  - Auto-scaling  │     │
    │  │  - Multi-zone    │     │
    │  └────┬─────┬───────┘     │
    │       │     │              │
    │  ┌────▼─────▼──────┐      │
    │  │  Azure Database │      │
    │  │  for PostgreSQL │      │
    │  └──────────────────┘      │
    │                             │
    │  ┌──────────────────┐      │
    │  │  Azure Cache     │      │
    │  │  for Redis       │      │
    │  └──────────────────┘      │
    └─────────────────────────────┘
```

## Step 1: Create Resource Group

```bash
# Set variables
RESOURCE_GROUP="almonds-production"
LOCATION="eastus"
AKS_CLUSTER_NAME="almonds-aks"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

## Step 2: Create AKS Cluster

```bash
# Create AKS cluster with managed identity
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_CLUSTER_NAME \
  --location $LOCATION \
  --node-count 3 \
  --min-count 3 \
  --max-count 10 \
  --enable-cluster-autoscaler \
  --node-vm-size Standard_D2s_v3 \
  --enable-managed-identity \
  --enable-addons monitoring \
  --enable-azure-rbac \
  --network-plugin azure \
  --network-policy azure \
  --zones 1 2 3 \
  --kubernetes-version 1.28.0 \
  --generate-ssh-keys

# Get credentials
az aks get-credentials \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_CLUSTER_NAME

# Verify cluster
kubectl get nodes
```

## Step 3: Create Container Registry (ACR)

```bash
ACR_NAME="almondsacr"

# Create ACR
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Premium \
  --location $LOCATION \
  --admin-enabled false

# Attach ACR to AKS
az aks update \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_CLUSTER_NAME \
  --attach-acr $ACR_NAME

# Login to ACR
az acr login --name $ACR_NAME

# Build and push image
docker build -t $ACR_NAME.azurecr.io/almonds-api:latest ../../
docker push $ACR_NAME.azurecr.io/almonds-api:latest
```

## Step 4: Create Azure Database for PostgreSQL

```bash
DB_SERVER_NAME="almonds-db-server"
DB_NAME="almonds"
DB_ADMIN_USER="almonds"
DB_ADMIN_PASSWORD="SecurePassword123!"

# Create PostgreSQL flexible server
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --location $LOCATION \
  --admin-user $DB_ADMIN_USER \
  --admin-password $DB_ADMIN_PASSWORD \
  --sku-name Standard_D2s_v3 \
  --tier GeneralPurpose \
  --version 15 \
  --storage-size 128 \
  --backup-retention 7 \
  --geo-redundant-backup Enabled \
  --high-availability ZoneRedundant \
  --public-access 0.0.0.0 \
  --tags Environment=Production Application=Almonds

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --database-name $DB_NAME

# Configure firewall to allow AKS
AKS_VNET_ID=$(az aks show --resource-group $RESOURCE_GROUP --name $AKS_CLUSTER_NAME --query "agentPoolProfiles[0].vnetSubnetId" -o tsv)

az postgres flexible-server vnet-rule create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --name AllowAKS \
  --vnet-name ${AKS_VNET_ID}

# Get connection string
az postgres flexible-server show-connection-string \
  --server-name $DB_SERVER_NAME \
  --database-name $DB_NAME \
  --admin-user $DB_ADMIN_USER
```

## Step 5: Create Azure Cache for Redis

```bash
REDIS_NAME="almonds-redis"

# Create Redis cache
az redis create \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_NAME \
  --location $LOCATION \
  --sku Premium \
  --vm-size P1 \
  --enable-non-ssl-port false \
  --minimum-tls-version 1.2 \
  --zones 1 2 3 \
  --redis-version 6 \
  --tags Environment=Production Application=Almonds

# Get Redis connection details
az redis show \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_NAME \
  --query "[hostName,sslPort]" \
  --output tsv

# Get Redis primary key
az redis list-keys \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_NAME \
  --query "primaryKey" \
  --output tsv
```

## Step 6: Create Application Gateway

```bash
APPGW_NAME="almonds-appgw"
APPGW_PUBLIC_IP="almonds-appgw-ip"

# Create public IP
az network public-ip create \
  --resource-group $RESOURCE_GROUP \
  --name $APPGW_PUBLIC_IP \
  --allocation-method Static \
  --sku Standard \
  --zone 1 2 3

# Create Application Gateway
az network application-gateway create \
  --resource-group $RESOURCE_GROUP \
  --name $APPGW_NAME \
  --location $LOCATION \
  --capacity 2 \
  --min-capacity 2 \
  --max-capacity 10 \
  --sku Standard_v2 \
  --public-ip-address $APPGW_PUBLIC_IP \
  --vnet-name ${AKS_CLUSTER_NAME}-vnet \
  --subnet appgw-subnet \
  --priority 1000

# Enable WAF
az network application-gateway waf-config set \
  --resource-group $RESOURCE_GROUP \
  --gateway-name $APPGW_NAME \
  --enabled true \
  --firewall-mode Prevention \
  --rule-set-type OWASP \
  --rule-set-version 3.2
```

## Step 7: Install Application Gateway Ingress Controller

```bash
# Add Helm repository
helm repo add application-gateway-kubernetes-ingress https://appgwingress.blob.core.windows.net/ingress-azure-helm-package/
helm repo update

# Get Application Gateway details
APPGW_ID=$(az network application-gateway show --resource-group $RESOURCE_GROUP --name $APPGW_NAME --query id -o tsv)
AKS_NODE_RG=$(az aks show --resource-group $RESOURCE_GROUP --name $AKS_CLUSTER_NAME --query nodeResourceGroup -o tsv)
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Create managed identity
IDENTITY_NAME="almonds-agic-identity"
az identity create \
  --resource-group $RESOURCE_GROUP \
  --name $IDENTITY_NAME

IDENTITY_CLIENT_ID=$(az identity show --resource-group $RESOURCE_GROUP --name $IDENTITY_NAME --query clientId -o tsv)
IDENTITY_RESOURCE_ID=$(az identity show --resource-group $RESOURCE_GROUP --name $IDENTITY_NAME --query id -o tsv)

# Assign permissions
az role assignment create \
  --role Contributor \
  --assignee $IDENTITY_CLIENT_ID \
  --scope $APPGW_ID

az role assignment create \
  --role Reader \
  --assignee $IDENTITY_CLIENT_ID \
  --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP

# Install AGIC
helm install ingress-azure \
  application-gateway-kubernetes-ingress/ingress-azure \
  --namespace kube-system \
  --set appgw.name=$APPGW_NAME \
  --set appgw.resourceGroup=$RESOURCE_GROUP \
  --set appgw.subscriptionId=$SUBSCRIPTION_ID \
  --set armAuth.type=aadPodIdentity \
  --set armAuth.identityResourceID=$IDENTITY_RESOURCE_ID \
  --set armAuth.identityClientID=$IDENTITY_CLIENT_ID \
  --set rbac.enabled=true
```

## Step 8: Configure Azure AD Pod Identity

```bash
# Install AAD Pod Identity
kubectl apply -f https://raw.githubusercontent.com/Azure/aad-pod-identity/master/deploy/infra/deployment-rbac.yaml

# Create Azure User Assigned Identity for pods
POD_IDENTITY_NAME="almonds-pod-identity"
az identity create \
  --resource-group $RESOURCE_GROUP \
  --name $POD_IDENTITY_NAME

POD_IDENTITY_CLIENT_ID=$(az identity show --resource-group $RESOURCE_GROUP --name $POD_IDENTITY_NAME --query clientId -o tsv)
POD_IDENTITY_RESOURCE_ID=$(az identity show --resource-group $RESOURCE_GROUP --name $POD_IDENTITY_NAME --query id -o tsv)

# Grant permissions to access Azure resources
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee $POD_IDENTITY_CLIENT_ID \
  --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP

# Create AzureIdentity and AzureIdentityBinding
cat <<EOF | kubectl apply -f -
apiVersion: aadpodidentity.k8s.io/v1
kind: AzureIdentity
metadata:
  name: almonds-identity
  namespace: default
spec:
  type: 0
  resourceID: $POD_IDENTITY_RESOURCE_ID
  clientID: $POD_IDENTITY_CLIENT_ID
---
apiVersion: aadpodidentity.k8s.io/v1
kind: AzureIdentityBinding
metadata:
  name: almonds-identity-binding
  namespace: default
spec:
  azureIdentity: almonds-identity
  selector: almonds-api-identity
EOF
```

## Step 9: Store Secrets in Azure Key Vault

```bash
KEY_VAULT_NAME="almonds-kv"

# Create Key Vault
az keyvault create \
  --resource-group $RESOURCE_GROUP \
  --name $KEY_VAULT_NAME \
  --location $LOCATION \
  --enable-rbac-authorization false \
  --enabled-for-deployment true

# Grant pod identity access to Key Vault
az keyvault set-policy \
  --name $KEY_VAULT_NAME \
  --object-id $POD_IDENTITY_CLIENT_ID \
  --secret-permissions get list

# Store secrets
az keyvault secret set --vault-name $KEY_VAULT_NAME --name database-url --value "postgresql://..."
az keyvault secret set --vault-name $KEY_VAULT_NAME --name jwt-secret --value "$(openssl rand -hex 32)"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name stripe-secret-key --value "sk_live_..."
az keyvault secret set --vault-name $KEY_VAULT_NAME --name sendgrid-api-key --value "SG...."

# Install Secrets Store CSI Driver
helm repo add csi-secrets-store-provider-azure https://azure.github.io/secrets-store-csi-driver-provider-azure/charts
helm install csi csi-secrets-store-provider-azure/csi-secrets-store-provider-azure \
  --namespace kube-system
```

## Step 10: Deploy Application

```bash
# Update configuration files with your values
export ACR_NAME="almondsacr"
export AZURE_REGION="eastus"
export SUBSCRIPTION_ID="your-subscription-id"
export RESOURCE_GROUP="almonds-production"

# Replace placeholders in manifests
envsubst < aks-deployment.yaml | kubectl apply -f -
envsubst < appgw-ingress.yaml | kubectl apply -f -

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

## Step 11: Configure DNS

```bash
# Get Application Gateway public IP
APPGW_PUBLIC_IP_ADDRESS=$(az network public-ip show \
  --resource-group $RESOURCE_GROUP \
  --name $APPGW_PUBLIC_IP \
  --query ipAddress \
  --output tsv)

# Create DNS zone (if not exists)
az network dns zone create \
  --resource-group $RESOURCE_GROUP \
  --name almonds.io

# Create A record
az network dns record-set a add-record \
  --resource-group $RESOURCE_GROUP \
  --zone-name almonds.io \
  --record-set-name api \
  --ipv4-address $APPGW_PUBLIC_IP_ADDRESS
```

## Step 12: Configure Monitoring

```bash
# Azure Monitor for containers is already enabled during cluster creation

# Install Prometheus and Grafana
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Configure Application Insights
APP_INSIGHTS_NAME="almonds-insights"
az monitor app-insights component create \
  --app $APP_INSIGHTS_NAME \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --kind web \
  --application-type web

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app $APP_INSIGHTS_NAME \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey \
  --output tsv)

# Add to application configuration
kubectl create secret generic app-insights \
  --from-literal=instrumentation-key=$INSTRUMENTATION_KEY
```

## Maintenance

### Update Application

```bash
# Build and push new image
docker build -t $ACR_NAME.azurecr.io/almonds-api:v1.1.0 ../../
docker push $ACR_NAME.azurecr.io/almonds-api:v1.1.0

# Update deployment
kubectl set image deployment/almonds-api almonds-api=$ACR_NAME.azurecr.io/almonds-api:v1.1.0

# Monitor rollout
kubectl rollout status deployment/almonds-api
```

### Database Migrations

```bash
# Run migrations in a job
kubectl run migrations \
  --image=$ACR_NAME.azurecr.io/almonds-api:latest \
  --restart=Never \
  --env="DATABASE_URL=$(kubectl get secret almonds-secrets -o jsonpath='{.data.database-url}' | base64 -d)" \
  -- npm run migrate:deploy
```

### Backup and Recovery

```bash
# Azure Database for PostgreSQL has automated backups enabled by default
# To restore:
az postgres flexible-server restore \
  --resource-group $RESOURCE_GROUP \
  --name almonds-db-restored \
  --source-server $DB_SERVER_NAME \
  --restore-time "2024-01-01T12:00:00Z"
```

## Cost Optimization

1. **Use Azure Reserved Instances** for AKS nodes
2. **Enable cluster autoscaling** to scale down during low traffic
3. **Use Azure Spot VMs** for non-critical workloads
4. **Configure storage lifecycle policies** for old backups
5. **Use Azure Hybrid Benefit** if you have Windows Server licenses

## Security Checklist

- [ ] Enable Azure Policy for AKS
- [ ] Configure Network Security Groups
- [ ] Enable Azure Database for PostgreSQL SSL
- [ ] Enable Azure Cache for Redis SSL
- [ ] Use Azure Key Vault for secrets
- [ ] Enable Application Gateway WAF
- [ ] Configure Azure AD authentication for AKS
- [ ] Use Pod Security Policies
- [ ] Enable Azure Defender for containers
- [ ] Configure network policies
- [ ] Enable audit logging

## Troubleshooting

### Pods not starting

```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

### Cannot connect to Azure Database

```bash
# Verify firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME

# Test connection from pod
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- psql $DATABASE_URL
```

### Application Gateway not routing traffic

```bash
# Check AGIC logs
kubectl logs -n kube-system -l app=ingress-azure

# Verify ingress events
kubectl describe ingress almonds-api-appgw
```

## Resources

- [Azure AKS Documentation](https://docs.microsoft.com/en-us/azure/aks/)
- [Application Gateway Ingress Controller](https://azure.github.io/application-gateway-kubernetes-ingress/)
- [Azure Database for PostgreSQL](https://docs.microsoft.com/en-us/azure/postgresql/)
- [Azure Cache for Redis](https://docs.microsoft.com/en-us/azure/azure-cache-for-redis/)
- [Azure Key Vault](https://docs.microsoft.com/en-us/azure/key-vault/)

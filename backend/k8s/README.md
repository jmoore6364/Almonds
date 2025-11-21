# Kubernetes Deployment

Production-ready Kubernetes configurations for deploying the Almonds backend across multiple cloud providers.

## Overview

This directory contains Kubernetes manifests and deployment guides for:

- **Base configurations** - Cloud-agnostic Kubernetes resources
- **AWS EKS** - Amazon Elastic Kubernetes Service
- **Azure AKS** - Azure Kubernetes Service
- **GCP GKE** - Google Kubernetes Engine

## Directory Structure

```
k8s/
├── base/                    # Base Kubernetes manifests
│   ├── deployment.yaml      # Application deployment with HPA
│   ├── service.yaml         # Service definitions
│   ├── ingress.yaml         # Generic ingress (NGINX)
│   ├── configmap.yaml       # Configuration data
│   ├── secrets.yaml.template # Secrets template (DO NOT COMMIT)
│   ├── rbac.yaml            # RBAC configuration
│   ├── pdb.yaml             # Pod Disruption Budget
│   └── network-policy.yaml  # Network policies
├── aws/                     # AWS EKS specific configs
│   ├── eks-deployment.yaml  # EKS-optimized deployment
│   ├── alb-ingress.yaml     # ALB Ingress Controller
│   ├── iam-service-account.yaml # IRSA configuration
│   └── README.md            # AWS deployment guide
├── azure/                   # Azure AKS specific configs
│   ├── aks-deployment.yaml  # AKS-optimized deployment
│   ├── appgw-ingress.yaml   # Application Gateway Ingress
│   └── README.md            # Azure deployment guide
├── gcp/                     # GCP GKE specific configs
│   ├── gke-deployment.yaml  # GKE-optimized deployment
│   ├── gclb-ingress.yaml    # Cloud Load Balancer Ingress
│   └── README.md            # GCP deployment guide
└── README.md                # This file
```

## Quick Start

### 1. Choose Your Cloud Provider

Select the cloud provider that matches your infrastructure:

- [AWS EKS](./aws/README.md) - Best for AWS-centric infrastructure
- [Azure AKS](./azure/README.md) - Best for Azure-centric infrastructure
- [GCP GKE](./gcp/README.md) - Best for GCP-centric infrastructure
- **Generic Kubernetes** - Use base configurations for any Kubernetes cluster

### 2. Follow Cloud-Specific Guide

Each cloud provider has a comprehensive deployment guide:

```bash
# AWS
cd aws
cat README.md

# Azure
cd azure
cat README.md

# GCP
cd gcp
cat README.md
```

### 3. Deploy Application

```bash
# Apply base configuration (all clouds)
kubectl apply -f base/

# Apply cloud-specific configuration
kubectl apply -f aws/  # or azure/ or gcp/
```

## Base Configuration

The `base/` directory contains cloud-agnostic Kubernetes resources that work on any Kubernetes cluster.

### Prerequisites

- Kubernetes cluster 1.25+
- kubectl configured
- NGINX Ingress Controller (for generic ingress)
- cert-manager (for SSL certificates)

### Deploy Base Configuration

```bash
# Create namespace (optional)
kubectl create namespace almonds

# Create secrets (replace with actual values)
kubectl create secret generic almonds-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=redis-password="..." \
  --from-literal=jwt-secret="..." \
  --from-literal=stripe-secret-key="..." \
  --from-literal=sendgrid-api-key="..."

# Apply configurations
kubectl apply -f base/configmap.yaml
kubectl apply -f base/rbac.yaml
kubectl apply -f base/service.yaml
kubectl apply -f base/deployment.yaml
kubectl apply -f base/ingress.yaml
kubectl apply -f base/pdb.yaml
kubectl apply -f base/network-policy.yaml

# Verify deployment
kubectl get pods
kubectl get svc
kubectl get ingress
```

## Cloud-Specific Features

### AWS EKS

**Key Features:**
- Application Load Balancer (ALB) integration
- IAM Roles for Service Accounts (IRSA)
- Amazon RDS for PostgreSQL
- Amazon ElastiCache for Redis
- AWS Secrets Manager integration
- VPC networking
- Auto Scaling Groups

**Best For:**
- AWS-native infrastructure
- Strong IAM integration requirements
- Multi-AZ deployments
- Cost optimization with Spot instances

### Azure AKS

**Key Features:**
- Application Gateway Ingress Controller
- Azure AD Pod Identity
- Azure Database for PostgreSQL
- Azure Cache for Redis
- Azure Key Vault integration
- Virtual Network integration
- Azure Monitor integration

**Best For:**
- Azure-native infrastructure
- Azure AD authentication
- Enterprise compliance requirements
- Hybrid cloud scenarios

### GCP GKE

**Key Features:**
- Cloud Load Balancer integration
- Workload Identity
- Cloud SQL for PostgreSQL
- Memorystore for Redis
- Secret Manager integration
- VPC-native networking
- Cloud Armor security

**Best For:**
- GCP-native infrastructure
- Serverless workloads (Autopilot)
- Global load balancing
- Advanced security with Cloud Armor

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Internet                              │
└────────────────┬────────────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │  DNS / CDN     │
         └───────┬────────┘
                 │
    ┌────────────▼──────────────┐
    │  Load Balancer / Ingress  │
    │  - SSL Termination        │
    │  - DDoS Protection        │
    │  - WAF (optional)         │
    └────────────┬──────────────┘
                 │
    ┌────────────▼──────────────┐
    │   Kubernetes Cluster      │
    │  ┌──────────────────┐     │
    │  │  Almonds API     │     │
    │  │  Deployment      │     │
    │  │  (Replicas: 3+)  │     │
    │  └────┬─────┬───────┘     │
    │       │     │              │
    │  ┌────▼─────▼──────┐      │
    │  │  PostgreSQL DB  │      │
    │  │  (Managed)       │      │
    │  └──────────────────┘      │
    │                             │
    │  ┌──────────────────┐      │
    │  │  Redis Cache     │      │
    │  │  (Managed)       │      │
    │  └──────────────────┘      │
    └─────────────────────────────┘
```

### Deployment Strategy

All configurations implement:

1. **High Availability**
   - Minimum 3 replicas
   - Pod anti-affinity for multi-zone distribution
   - Pod Disruption Budget (PDB) to maintain availability
   - Rolling update strategy with zero downtime

2. **Auto-Scaling**
   - Horizontal Pod Autoscaler (HPA)
   - CPU and memory-based scaling
   - Cluster autoscaling (cloud-specific)

3. **Health Checks**
   - Liveness probes (`/api/v1/health/live`)
   - Readiness probes (`/api/v1/health/ready`)
   - Startup probes for slow-starting containers

4. **Security**
   - Network policies for traffic control
   - RBAC for least-privilege access
   - Pod security context (non-root user)
   - Secrets management (cloud-specific)
   - TLS/SSL encryption

5. **Monitoring**
   - Prometheus metrics exposed (`/api/v1/metrics`)
   - Cloud-native monitoring integration
   - Structured logging
   - Distributed tracing

## Resource Requirements

### Minimum Requirements

- **CPU**: 250m per pod (3 pods = 750m)
- **Memory**: 512Mi per pod (3 pods = 1.5Gi)
- **Storage**: 100Gi for database

### Recommended Production

- **CPU**: 1000m per pod (3-10 pods = 3-10 cores)
- **Memory**: 1Gi per pod (3-10 pods = 3-10Gi)
- **Storage**: 500Gi for database with auto-scaling

### Node Pool Configuration

**Standard Configuration:**
```yaml
Machine Type: 2 vCPU, 8GB RAM
Min Nodes: 3
Max Nodes: 10
Auto-scaling: Enabled
```

**High-Traffic Configuration:**
```yaml
Machine Type: 4 vCPU, 16GB RAM
Min Nodes: 5
Max Nodes: 20
Auto-scaling: Enabled
```

## Environment Variables

The application requires the following environment variables:

### Required

- `NODE_ENV` - Environment (production/staging)
- `PORT` - Application port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` - Redis hostname
- `REDIS_PORT` - Redis port
- `JWT_SECRET` - JWT signing secret
- `CORS_ORIGIN` - Allowed CORS origin

### Optional (Feature-Specific)

- `STRIPE_SECRET_KEY` - Stripe API key (billing)
- `SENDGRID_API_KEY` - SendGrid API key (email)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `SENTRY_DSN` - Sentry error tracking DSN

## Secrets Management

### Development/Testing

```bash
kubectl create secret generic almonds-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=jwt-secret="$(openssl rand -hex 32)"
```

### Production

Use cloud-specific secrets management:

- **AWS**: AWS Secrets Manager + External Secrets Operator
- **Azure**: Azure Key Vault + CSI Driver
- **GCP**: Secret Manager + Workload Identity

## Networking

### Service Mesh (Optional)

For advanced traffic management, consider using a service mesh:

- **Istio** - Full-featured service mesh
- **Linkerd** - Lightweight service mesh
- **AWS App Mesh** - AWS-native service mesh

### Network Policies

Default network policies restrict:
- Ingress: Only from ingress controller and monitoring
- Egress: Only to database, Redis, and external APIs

## Monitoring & Logging

### Metrics

Exposed via Prometheus format at `/api/v1/metrics`:
- Request rate
- Error rate
- Response time (p50, p95, p99)
- Active connections
- Database connection pool
- Authentication metrics

### Logs

Structured JSON logs sent to:
- **AWS**: CloudWatch Logs
- **Azure**: Azure Monitor Logs
- **GCP**: Cloud Logging

### Tracing

Optional distributed tracing integration:
- Jaeger
- Zipkin
- Cloud-native tracing (AWS X-Ray, Azure Monitor, Cloud Trace)

## Disaster Recovery

### Backup Strategy

1. **Database Backups**
   - Automated daily backups
   - Point-in-time recovery
   - 7-day retention (minimum)
   - Cross-region replication (production)

2. **Configuration Backups**
   - Store manifests in version control (Git)
   - Use GitOps for deployment (ArgoCD, Flux)

3. **Secrets Backup**
   - Cloud-managed secret backup
   - Encrypted backups to secure storage

### Recovery Procedures

**Database Recovery:**
```bash
# Cloud-specific commands in each provider's README
# Generally: Restore from latest backup or point-in-time
```

**Application Recovery:**
```bash
# Redeploy from Git
kubectl apply -f k8s/base/
kubectl apply -f k8s/<cloud>/
```

## Scaling Strategy

### Horizontal Scaling

```bash
# Manual scaling
kubectl scale deployment almonds-api --replicas=10

# Auto-scaling is configured via HPA
# Scales based on CPU (70%) and Memory (80%)
```

### Vertical Scaling

```yaml
# Update resource limits in deployment.yaml
resources:
  requests:
    cpu: "500m"
    memory: "1Gi"
  limits:
    cpu: "2000m"
    memory: "2Gi"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Kubernetes
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to GKE
        run: |
          gcloud container clusters get-credentials ...
          kubectl apply -f k8s/gcp/
```

### GitOps with ArgoCD

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Create application
argocd app create almonds \
  --repo https://github.com/almonds/almonds \
  --path k8s/gcp \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace default
```

## Security Best Practices

1. **Cluster Security**
   - Enable RBAC
   - Use Pod Security Policies/Standards
   - Configure Network Policies
   - Enable audit logging

2. **Image Security**
   - Scan images for vulnerabilities
   - Use minimal base images
   - Sign images
   - Use private registries

3. **Runtime Security**
   - Run as non-root user
   - Read-only root filesystem
   - Drop all capabilities
   - Use security contexts

4. **Secrets Management**
   - Never commit secrets to Git
   - Use cloud-managed secret stores
   - Rotate secrets regularly
   - Encrypt secrets at rest

## Cost Optimization

1. **Right-sizing**
   - Monitor actual resource usage
   - Adjust requests/limits accordingly
   - Use vertical pod autoscaler

2. **Auto-scaling**
   - Scale down during low traffic
   - Use cluster autoscaler
   - Consider spot/preemptible instances

3. **Reserved Capacity**
   - Use reserved instances for stable workloads
   - Commit to 1-year or 3-year terms

4. **Resource Cleanup**
   - Delete unused resources
   - Clean up old images
   - Remove stale PersistentVolumes

## Troubleshooting

### Common Issues

**Pods not starting:**
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

**Cannot reach service:**
```bash
kubectl get svc
kubectl get endpoints
kubectl describe ingress
```

**Database connection issues:**
```bash
# Test from pod
kubectl exec -it <pod-name> -- sh
ping <database-host>
```

**High resource usage:**
```bash
kubectl top nodes
kubectl top pods
```

### Debug Commands

```bash
# Get all resources
kubectl get all

# Describe resource
kubectl describe <resource-type> <resource-name>

# View logs
kubectl logs <pod-name> [-c container-name]

# Execute command in pod
kubectl exec -it <pod-name> -- sh

# Port forward for local testing
kubectl port-forward <pod-name> 3000:3000
```

## Support

For cloud-specific issues, refer to:
- [AWS EKS Documentation](./aws/README.md)
- [Azure AKS Documentation](./azure/README.md)
- [GCP GKE Documentation](./gcp/README.md)

For application issues, see:
- [Main README](../../README.md)
- [Troubleshooting Guide](../TROUBLESHOOTING.md)
- [API Documentation](../API.md)

## Contributing

When adding new Kubernetes configurations:

1. Update base configurations first
2. Add cloud-specific variations
3. Update relevant README files
4. Test on actual cloud infrastructure
5. Document resource requirements
6. Include cost estimates

---

**Last Updated**: 2024-01-01
**Kubernetes Version**: 1.25+
**Maintained By**: Almonds DevOps Team

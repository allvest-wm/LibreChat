# LibreChat Kubernetes Deployment Guide

## Issues Found in Your Original Helm Values

### 🔴 Critical Issues
1. **YAML Syntax Error**: Incorrect indentation in `configYamlContent` - `summarize` and `modelDisplayLabel` were outside the endpoint definition
2. **Security Risk**: Hardcoded secrets in plaintext (CREDS_KEY, JWT_SECRET, etc.) should be in Kubernetes Secrets
3. **Duplicate Configuration**: `existingSecretName` defined in both `global.librechat` and `librechat`

### ⚠️ Configuration Issues
4. **Version Mismatch**: librechat.yaml version `1.0.8` should be `1.2.8`
5. **Meilisearch Version**: Using `v1.7.3` instead of `v1.12.3` (from your docker-compose)
6. **Missing Environment Variables**: No MONGO_URI, DOMAIN_CLIENT, DOMAIN_SERVER, etc.
7. **Model Name Inconsistency**: Local uses "Allvest AI" but Helm uses "Investment Bot"
8. **Base URL Difference**: Local uses `http://host.docker.internal:3000` but Helm uses GCP URL

---

## Pre-Deployment Steps

### 1. Generate Secrets (if you haven't already)

```bash
# Generate CREDS_KEY (32 bytes hex)
openssl rand -hex 32

# Generate CREDS_IV (16 bytes hex)
openssl rand -hex 16

# Generate JWT_SECRET (32 bytes hex)
openssl rand -hex 32

# Generate JWT_REFRESH_SECRET (32 bytes hex)
openssl rand -hex 32

# Generate MEILI_MASTER_KEY
openssl rand -base64 32
```

### 2. Create Kubernetes Secret

**Option A: From .env file**
```bash
# Create secret from your .env file
kubectl create secret generic librechat-credentials-env \
  --from-env-file=.env \
  --namespace=default
```

**Option B: From YAML file**
```bash
# Edit k8s-secret-example.yaml with your values
# Then apply it
kubectl apply -f k8s-secret-example.yaml
```

### 3. Update helm-values-corrected.yaml

Update the following values:

```yaml
# Update domain names (lines ~35-37)
DOMAIN_CLIENT: "https://your-actual-domain.com"
DOMAIN_SERVER: "https://your-actual-domain.com"

# Update ingress host (lines ~146-148)
ingress:
  hosts:
    - host: your-actual-domain.com

# Update TLS configuration (lines ~150-153)
tls:
  - secretName: your-tls-secret-name
    hosts:
      - your-actual-domain.com
```

### 4. Verify Configuration Alignment

Make sure your configuration matches your use case:

**Current Helm Config:**
- Endpoint: "Smart Allvest"
- Base URL: `https://chat-bot-adapter-api-713711456994.asia-south1.run.app`
- Model: "Investment Bot"

**Your Local Config:**
- Endpoint: "Smart Allvest"
- Base URL: `http://host.docker.internal:3000`
- Model: "Allvest AI"

**Decision needed:** Are you deploying to Kubernetes with the GCP URL, or do you need to update it?

---

## Deployment Steps

### 1. Add Helm Repository (if not already added)

```bash
# Add LibreChat Helm repo
helm repo add librechat https://charts.librechat.ai
helm repo update
```

### 2. Create Namespace (optional)

```bash
kubectl create namespace librechat
```

### 3. Deploy with Helm

```bash
# Deploy with corrected values
helm install librechat librechat/librechat \
  -f helm-values-corrected.yaml \
  --namespace librechat

# Or if updating existing deployment
helm upgrade librechat librechat/librechat \
  -f helm-values-corrected.yaml \
  --namespace librechat
```

### 4. Verify Deployment

```bash
# Check pods
kubectl get pods -n librechat

# Check services
kubectl get svc -n librechat

# Check ingress
kubectl get ingress -n librechat

# View logs
kubectl logs -f deployment/librechat -n librechat
```

---

## Post-Deployment Verification

### 1. Check Pod Status

```bash
kubectl get pods -n librechat -w
```

Expected output:
```
NAME                                    READY   STATUS    RESTARTS   AGE
librechat-xxxxxxxx-xxxxx               1/1     Running   0          2m
librechat-mongodb-xxxxxxxx-xxxxx       1/1     Running   0          2m
librechat-meilisearch-xxxxxxxx-xxxxx   1/1     Running   0          2m
```

### 2. Check Logs for Errors

```bash
# LibreChat logs
kubectl logs -f deployment/librechat -n librechat

# MongoDB logs
kubectl logs -f deployment/librechat-mongodb -n librechat

# Meilisearch logs
kubectl logs -f deployment/librechat-meilisearch -n librechat
```

### 3. Test Database Connection

```bash
# Exec into LibreChat pod
kubectl exec -it deployment/librechat -n librechat -- sh

# Inside the pod, test MongoDB connection
mongosh $MONGO_URI --eval "db.adminCommand('ping')"
```

### 4. Access the Application

```bash
# If using port-forward for testing
kubectl port-forward svc/librechat 3080:3080 -n librechat

# Then access: http://localhost:3080
```

Or via ingress: `https://your-actual-domain.com`

---

## Troubleshooting

### Pod Not Starting

```bash
# Describe pod for events
kubectl describe pod <pod-name> -n librechat

# Check events in namespace
kubectl get events -n librechat --sort-by='.lastTimestamp'
```

### Database Connection Issues

```bash
# Check if MongoDB is accessible
kubectl exec -it deployment/librechat -n librechat -- sh -c "nc -zv librechat-mongodb 27017"

# Check MongoDB logs
kubectl logs deployment/librechat-mongodb -n librechat
```

### Meilisearch Connection Issues

```bash
# Check if Meilisearch is accessible
kubectl exec -it deployment/librechat -n librechat -- sh -c "curl http://librechat-meilisearch:7700/health"
```

### Secret Not Found

```bash
# Verify secret exists
kubectl get secret librechat-credentials-env -n librechat

# View secret keys (not values)
kubectl describe secret librechat-credentials-env -n librechat
```

### Ingress Not Working

```bash
# Check ingress
kubectl describe ingress librechat -n librechat

# Check ingress controller logs (example for nginx-ingress)
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

---

## Configuration Comparison

### Your Local Docker Setup vs Kubernetes

| Component | Docker Compose | Kubernetes (Helm) |
|-----------|----------------|-------------------|
| MongoDB | `mongodb://127.0.0.1:27017` | `mongodb://librechat-mongodb:27017` |
| Meilisearch | `http://0.0.0.0:7700` | `http://librechat-meilisearch:7700` |
| Base URL | `http://host.docker.internal:3000` | `https://chat-bot-adapter-api...` |
| Model Name | "Allvest AI" | "Investment Bot" |
| LibreChat Version | 1.2.8 | 1.2.8 (corrected) |

---

## Security Checklist

- [ ] Secrets are in Kubernetes Secret, not in values.yaml
- [ ] MongoDB authentication enabled (recommended for production)
- [ ] TLS/SSL configured for ingress
- [ ] Network policies applied (optional but recommended)
- [ ] Resource limits set
- [ ] RBAC configured
- [ ] Sensitive values not committed to git

---

## Next Steps

1. **Review the corrected `helm-values-corrected.yaml`**
2. **Create the Kubernetes secret** using `k8s-secret-example.yaml`
3. **Update domain names** in the values file
4. **Deploy using Helm** following the steps above
5. **Monitor logs** during initial deployment
6. **Test the application** via ingress or port-forward

---

## Questions to Consider

1. **Which model name do you want to use?**
   - "Allvest AI" (local)
   - "Investment Bot" (current Helm)

2. **Which base URL is correct for Kubernetes?**
   - GCP URL: `https://chat-bot-adapter-api-713711456994.asia-south1.run.app`
   - Or different URL?

3. **Do you need RAG API enabled?**
   - Currently disabled in both setups

4. **What is your actual domain name?**
   - Replace `chat.example.com` with your actual domain

5. **Do you have TLS certificates?**
   - Using cert-manager?
   - Manual certificate?

---

## Additional Resources

- [LibreChat Documentation](https://docs.librechat.ai/)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Helm Values Files](https://helm.sh/docs/chart_template_guide/values_files/)
- [LibreChat Helm Chart](https://github.com/danny-avila/LibreChat/tree/main/charts/librechat)

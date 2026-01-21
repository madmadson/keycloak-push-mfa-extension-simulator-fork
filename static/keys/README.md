# RSA-JWK Key

## Container Deployment

When deploying this application in a container (Docker), the RSA-JWK key file (`rsa-jwk.json`) needs to be available to the application. Follow these steps:

### Using Docker Volume Mount

Mount the `static/keys/` directory into the container at the same path:

```bash
docker run -v $(pwd)/static/keys:/app/static/keys -p 8080:8080 keycloak-push-mfa-extension
```

Or in `docker-compose.yml`:

```yaml
volumes:
  - ./static/keys:/app/static/keys
```

### Key File Location

The application expects the RSA-JWK key at:

- **Host**: `./static/keys/rsa-jwk.json`
- **Container**: `/app/static/keys/rsa-jwk.json`

Ensure the `rsa-jwk.json` file is present in this directory before starting the container. The file contains the RSA public and private keys in JWK format used for token signing and validation.

### Building the Docker Image

The key file is included in the built Docker image via the `Dockerfile`:

```dockerfile
COPY static/keys/ /app/static/keys/
```

This ensures the keys are available at runtime in the container.

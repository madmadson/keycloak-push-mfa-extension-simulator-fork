# Keycloak push mfa extension simulator

Simulator for Keycloak push MFA Extension

## start local

mvn spring-boot:run

## typescript watchmode

npm run dev

## docker

docker build -t push-mfa-extension-simulator .

docker run -p 5000:5000 push-mfa-extension-simulator

open localhost:5000 in browser
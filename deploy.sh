#!/bin/bash

set -e

echo "Starting deployment..."

cd ~/assal-kolhapuri-dryfruits

echo "Pulling latest API image..."
docker compose pull api

echo "Recreating API container..."
docker compose up -d --force-recreate api

echo "Checking containers..."
docker compose ps

echo "Deployment completed."

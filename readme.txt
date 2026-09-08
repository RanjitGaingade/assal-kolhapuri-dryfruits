# Assal Kolhapuri Dryfruits – AWS DevOps Project

An end-to-end, production-style deployment of a Node.js e-commerce application on AWS, built to practice real-world **Infrastructure as Code, CI/CD automation, containerization, and cloud operations**.

This project takes a REST API from source code to a fully automated, secured, and monitored AWS deployment — provisioned entirely with Terraform and deployed via GitHub Actions.

## Architecture

![AWS Architecture Diagram](docs/Architecture-diagram.png)

The application runs on AWS EC2 behind an Application Load Balancer, with a PostgreSQL database on RDS and Docker containers. The ALB handles routing and traffic distribution directly to the containerized application. Infrastructure is provisioned with Terraform, and deployments are automated end-to-end through GitHub Actions using OIDC-based secure authentication (no long-lived AWS credentials).

## Tech Stack

**Application:** Node.js, Express.js, PostgreSQL, Prisma
**Infrastructure:** AWS (EC2, VPC, RDS, ALB, Route 53, IAM, ECR, S3, Secrets Manager, CloudWatch, Systems Manager), Terraform
**Containers:** Docker
**CI/CD:** GitHub Actions, GitHub OIDC, Docker Hub / ECR
**Security & Quality:** Trivy (vulnerability scanning), npm audit, ESLint
**Testing:** Jest, Supertest
**Monitoring:** AWS CloudWatch

## Key Features

- **Infrastructure as Code** — All AWS resources (VPC, subnets, EC2, RDS, IAM roles, security groups, ECR, S3) provisioned via reusable, version-controlled Terraform modules.
- **Secure CI/CD Pipeline** — GitHub Actions pipeline covering code validation, automated testing, Docker image builds, Trivy vulnerability scanning, image publishing, and automated EC2 deployment.
- **Zero long-lived AWS credentials** — GitHub authenticates to AWS via OIDC federation instead of stored access keys.
- **Git SHA-based image tagging** — every deployed container image is traceable back to the exact source commit.
- **Dependency vulnerability remediation** — identified and resolved a transitive `deepmerge-ts` vulnerability in the Prisma dependency tree using npm overrides, validated with `npm audit`.
- **Health checks & deployment verification** — automated PostgreSQL health checks and post-deployment verification steps built into the pipeline.
- **Load balancing & routing** — Route 53 and an Application Load Balancer handle DNS resolution and traffic distribution directly to the containerized application on EC2.
- **Observability** — CPU, memory, API request rates, latency, and container health, with AWS CloudWatch monitoring.

## CI/CD Pipeline Overview

1. Code pushed to GitHub triggers the GitHub Actions workflow.
2. Code validation, linting (ESLint), and automated tests (Jest, Supertest) run first.
3. A Docker image is built and scanned for HIGH/CRITICAL vulnerabilities using Trivy — the pipeline fails on unresolved critical issues.
4. The image is tagged with the Git commit SHA and pushed to the registry.
5. GitHub authenticates to AWS via OIDC and deploys the new image to EC2 over SSH.
6. Running containers are verified post-deployment to confirm a healthy release.

## Project Structure

```
├── .github/workflows/     # GitHub Actions CI/CD pipeline definitions
├── docs/                  # Architecture diagrams and documentation
├── terraform/             # Infrastructure as Code (VPC, EC2, RDS, ALB, IAM, S3, Route 53)
├── prisma/                # Database schema and migrations
├── public/                # Static application assets
├── tests/                 # Automated test suites
├── certs/                 # AWS RDS public root CA bundle (for SSL DB connections)
├── .dockerignore
├── .gitignore
└── README.md
```

## Local Development

```bash
# Clone the repository
git clone https://github.com/RanjitGaingade/assal-kolhapuri-dryfruits.git
cd assal-kolhapuri-dryfruits

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start the application
npm run dev
```

## Deployment

Deployment is fully automated via GitHub Actions on every push to the default branch. Infrastructure changes are managed separately through Terraform:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Author

**Ranjit Gaingade**
AWS Cloud / DevOps Engineer
[ranjitvidhyarthi@gmail.com](mailto:ranjitvidhyarthi@gmail.com)

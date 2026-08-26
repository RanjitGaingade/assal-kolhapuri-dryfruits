
terraform {
  required_version = "~> 1.15.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

}
data "aws_ssm_parameter" "amazon_linux_2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"


}

module "vpc" {
  source = "../../modules/vpc"

  name                 = var.project_name
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs

  tags = {
    Project     = "Assal-Kolhapuri-Dryfruits"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

module "iam" {
  source = "../../modules/iam"

  name           = var.project_name
  rds_secret_arn = module.rds.master_user_secret_arn

  tags = {
    Project     = "Assal-Kolhapuri-Dryfruits"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}
module "security_group" {
  source = "../../modules/security-group"

  name     = var.project_name
  vpc_id   = module.vpc.vpc_id
  ssh_cidr = var.ssh_cidr

  tags = {
    Project     = "Assal-Kolhapuri-Dryfruits"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}
module "ec2" {
  source = "../../modules/ec2"

  name                  = var.project_name
  ami_id                = data.aws_ssm_parameter.amazon_linux_2023.value
  instance_type         = var.instance_type
  subnet_id             = module.vpc.public_subnet_ids[0]
  instance_profile_name = module.iam.instance_profile_name
  security_group_ids    = [module.security_group.security_group_id]

  tags = {
    Project     = "Assal-Kolhapuri-Dryfruits"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

module "rds" {
  source = "../../modules/rds"

  name = var.project_name

  vpc_id = module.vpc.vpc_id

  private_subnet_ids = module.vpc.private_subnet_ids

  ec2_security_group_id = module.security_group.security_group_id

  database_name     = var.database_name
  database_username = var.database_username

  tags = {
    Project     = "Assal-Kolhapuri-Dryfruits"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

module "ecr" {
  source = "../../modules/ecr"

  name = "assal-kolhapuri-api"

  tags = {
    Project     = "Assal-Kolhapuri-Dryfruits"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

module "github_oidc" {
  source = "../../modules/github-oidc"

  name                 = var.project_name
  github_owner         = "RanjitGaingade"
  github_owner_id      = "313410174"
  github_repository    = "assal-kolhapuri-dryfruits"
  github_repository_id = "1328946065"
  github_branch        = "aws-terraform-infra"

  ecr_repository_arn = module.ecr.repository_arn

  ec2_instance_id = module.ec2.instance_id
  aws_region      = var.aws_region


  tags = {
    Project     = "Assal-Kolhapuri-Dryfruits"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

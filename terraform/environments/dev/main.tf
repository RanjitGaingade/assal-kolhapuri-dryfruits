
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

  product_images_bucket_arn = module.s3.bucket_arn

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
  ami_id                = var.ami_id
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

module "s3" {
  source = "../../modules/s3"

  project_name = var.project_name
  environment  = var.environment
}

module "route53" {
  source = "../../modules/route53"

  domain_name  = var.domain_name
  alb_dns_name = module.alb.alb_dns_name
  alb_zone_id  = module.alb.alb_zone_id
}

module "alb" {
  source = "../../modules/alb"

  name = var.project_name

  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids

  target_instance_id = module.ec2.instance_id

  tags = {
    Project     = "Assal-Kolhapuri-Dryfruits"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_vpc_security_group_ingress_rule" "ec2_from_alb" {
  security_group_id            = module.security_group.security_group_id
  referenced_security_group_id = module.alb.alb_security_group_id

  from_port   = 3000
  to_port     = 3000
  ip_protocol = "tcp"

  description = "Allow application traffic from ALB"
}

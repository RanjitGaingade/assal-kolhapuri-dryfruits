variable "name" {
  description = "Name prefix for GitHub OIDC resources"
  type        = string
}

variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
}

variable "github_owner_id" {
  description = "GitHub owner ID used in the OIDC subject"
  type        = string
}

variable "github_repository_id" {
  description = "GitHub repository ID used in the OIDC subject"
  type        = string
}
variable "github_repository" {
  description = "GitHub repository name"
  type        = string
}

variable "github_branch" {
  description = "GitHub branch allowed to assume the role"
  type        = string
  default     = "main"
}

variable "ecr_repository_arn" {
  description = "ECR repository ARN allowed for GitHub Actions"
  type        = string
}

variable "tags" {
  description = "Tags for GitHub OIDC resources"
  type        = map(string)
  default     = {}
}

variable "ec2_instance_id" {
  description = "EC2 instance ID used for SSM deployments"
  type        = string
}

variable "aws_region" {
  description = "AWS region used for SSM deployment"
  type        = string
}

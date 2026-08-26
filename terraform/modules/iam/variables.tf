variable "name" {
  description = "Name prefix for IAM resources"
  type        = string
}

variable "tags" {
  description = "Tags for IAM resources"
  type        = map(string)
  default     = {}
}

variable "rds_secret_arn" {
  description = "ARN of the RDS-managed Secrets Manager secret"
  type        = string
}

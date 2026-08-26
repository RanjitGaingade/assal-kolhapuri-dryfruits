variable "name" {
  description = "Name prefix for RDS resources"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for RDS"
  type        = list(string)
}

variable "ec2_security_group_id" {
  description = "Security group ID of the EC2 instance"
  type        = string
}

variable "database_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "assalkolhapuri"
}

variable "database_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "postgres"
}


variable "engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "16"
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  description = "Initial storage in GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum autoscaled storage in GB"
  type        = number
  default     = 50
}

variable "tags" {
  description = "Tags for RDS resources"
  type        = map(string)
  default     = {}
}

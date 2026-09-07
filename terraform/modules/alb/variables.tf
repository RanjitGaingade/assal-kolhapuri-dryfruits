variable "name" {
  description = "Name prefix for ALB resources"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the ALB will be created"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for the ALB"
  type        = list(string)
}

variable "target_instance_id" {
  description = "EC2 instance ID to register with the target group"
  type        = string
}

variable "tags" {
  description = "Tags for ALB resources"
  type        = map(string)
  default     = {}
}

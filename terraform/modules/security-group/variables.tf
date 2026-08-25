variable "name" {
  description = "Security group name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "ssh_cidr" {
  description = "CIDR allowed to connect using SSH"
  type        = string
}

variable "tags" {
  description = "Security group tags"
  type        = map(string)
  default     = {}
}

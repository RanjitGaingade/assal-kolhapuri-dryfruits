variable "name" {
  description = "Name prefix for EC2 resources"
  type        = string
}

variable "ami_id" {
  description = "AMI ID for the EC2 instance"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "subnet_id" {
  description = "Subnet where EC2 will be launched"
  type        = string
}

variable "instance_profile_name" {
  description = "IAM instance profile attached to EC2"
  type        = string
}

variable "security_group_ids" {
  description = "Security groups attached to EC2"
  type        = list(string)
}

variable "tags" {
  description = "Tags for EC2 resources"
  type        = map(string)
  default     = {}
}

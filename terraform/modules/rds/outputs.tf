output "db_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.postgres.id
}

output "db_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.address
}

output "db_port" {
  description = "RDS PostgreSQL port"
  value       = aws_db_instance.postgres.port
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.postgres.db_name
}

output "db_username" {
  description = "Database username"
  value       = aws_db_instance.postgres.username
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

output "master_user_secret_arn" {
  description = "ARN of the RDS-managed master user secret"
  value       = aws_db_instance.postgres.master_user_secret[0].secret_arn
}

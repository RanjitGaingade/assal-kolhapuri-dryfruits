output "hosted_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.this.zone_id
}

output "name_servers" {
  description = "Name servers assigned to the Route 53 hosted zone"
  value       = aws_route53_zone.this.name_servers
}

output "domain_name" {
  description = "Application domain name"
  value       = aws_route53_record.root.name
}


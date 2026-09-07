resource "aws_security_group" "ec2" {
  name        = "${var.name}-sg"
  description = "Security group for Assal Kolhapuri EC2"
  vpc_id      = var.vpc_id

  egress {
    description = "Allow outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-sg"
    }
  )
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  security_group_id = aws_security_group.ec2.id

  from_port   = 22
  to_port     = 22
  ip_protocol = "tcp"
  cidr_ipv4   = var.ssh_cidr

  description = "SSH"
}

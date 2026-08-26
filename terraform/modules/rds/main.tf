resource "aws_security_group" "rds" {
  name        = "${var.name}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.ec2_security_group_id]
  }

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
      Name = "${var.name}-rds-sg"
    }
  )
}

resource "aws_db_subnet_group" "rds" {
  name       = "${var.name}-rds-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-rds-subnet-group"
    }
  )
}

resource "aws_db_instance" "postgres" {
  identifier = "${var.name}-postgres"

  engine         = "postgres"
  engine_version = var.engine_version

  instance_class        = var.instance_class
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.database_name
  username = var.database_username
  manage_master_user_password = true
  port     = 5432

  db_subnet_group_name = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [
    aws_security_group.rds.id
  ]

  publicly_accessible    = false
  multi_az               = false
  backup_retention_period = 0

  skip_final_snapshot = true
  deletion_protection = false

  auto_minor_version_upgrade = true

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-postgres"
    }
  )
}

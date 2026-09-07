resource "aws_security_group" "alb" {
  name        = "${var.name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
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
      Name = "${var.name}-alb-sg"
    }
  )
}

resource "aws_lb" "this" {
  name               = "${var.name}-alb"
  internal           = false
  load_balancer_type = "application"

  security_groups = [
    aws_security_group.alb.id
  ]

  subnets = var.public_subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-alb"
    }
  )
}

resource "aws_lb_target_group" "this" {
  name     = "${var.name}-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  target_type = "instance"

  health_check {
    enabled             = true
    protocol            = "HTTP"
    path                = "/health"
    port                = "3000"

    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-tg"
    }
  )
}

resource "aws_lb_target_group_attachment" "ec2" {
  target_group_arn = aws_lb_target_group.this.arn
  target_id        = var.target_instance_id
  port             = 3000
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this.arn
  }
}

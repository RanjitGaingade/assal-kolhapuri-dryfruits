locals {
  user_data = file("${path.module}/scripts/user-data.sh")
}

resource "aws_instance" "this" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  iam_instance_profile        = var.instance_profile_name
  vpc_security_group_ids      = var.security_group_ids
  associate_public_ip_address = true

  user_data                   = local.user_data
  user_data_replace_on_change = true

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-ec2"
    }
  )
}

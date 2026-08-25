#!/bin/bash

set -e

dnf update -y

dnf install -y docker amazon-ssm-agent

systemctl enable docker
systemctl start docker

systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

usermod -aG docker ec2-user

echo "Docker installation completed" > /var/log/assal-kolhapuri-bootstrap.log
docker --version >> /var/log/assal-kolhapuri-bootstrap.log

echo "SSM Agent status:" >> /var/log/assal-kolhapuri-bootstrap.log
systemctl is-active amazon-ssm-agent >> /var/log/assal-kolhapuri-bootstrap.log

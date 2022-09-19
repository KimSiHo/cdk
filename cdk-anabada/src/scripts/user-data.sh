#!/bin/bash

aws s3 cp s3://anabada-project/anabada-all.pem /home/ec2-user/anabada-all.pem
chown ec2-user anabada-all.pem
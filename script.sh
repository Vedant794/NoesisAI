#!/bin/bash

set -e

if [ "$EUID" -ne 0 ]; then
  echo "Please run this script as root (sudo ./setup_noesis.sh)"
  exit 1
fi

yum update -y

if ! command -v git &> /dev/null; then
    yum install -y git
fi

if ! command -v docker &> /dev/null; then
    yum install -y docker
    systemctl enable docker
    systemctl start docker
    usermod -aG docker ec2-user
fi

if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION="1.29.2"
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

if ! ldconfig -p | grep -q libcrypt.so.1; then
    yum install -y libxcrypt-compat
fi

if [ ! -d "NoesisAI" ]; then
    git clone https://github.com/Vedant794/NoesisAI.git
fi

cd NoesisAI/runner/Runner
chmod +x ./app

docker-compose up -d
docker-compose -f mongo.yml up -d
docker pull node:18

cat <<EOF > /home/ec2-user/noesis_runner.sh
#!/bin/bash
cd /home/ec2-user/NoesisAI/runner/Runner
sudo ./app >> /home/ec2-user/noesis_runner.log 2>&1
EOF

chmod +x /home/ec2-user/noesis_runner.sh
chown ec2-user:ec2-user /home/ec2-user/noesis_runner.sh

cat <<EOF > /etc/systemd/system/noesis-runner.service
[Unit]
Description=NoesisAI App Binary Runner
After=network.target docker.service

[Service]
Type=simple
ExecStart=/bin/bash /home/ec2-user/noesis_runner.sh
Restart=always
User=ec2-user
WorkingDirectory=/home/ec2-user/NoesisAI/runner/Runner

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reexec
systemctl daemon-reload
systemctl enable noesis-runner
systemctl start noesis-runner

echo ""
echo "Setup complete!"
echo "Reminder: Open port 9000 in your EC2 Security Group!"
echo "Please logout and login again to apply Docker group permissions."

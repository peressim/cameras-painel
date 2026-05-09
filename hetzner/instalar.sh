#!/bin/bash
# ============================================================
# instalar.sh — IoT Hub JIMI no servidor Hetzner
# Execute como root: bash instalar.sh
# ============================================================

set -e
IP_SERVIDOR="178.105.90.63"

echo "================================================"
echo " Instalando IoT Hub JIMI — $IP_SERVIDOR"
echo "================================================"

# 1. Atualizar sistema
echo "[1/6] Atualizando sistema..."
apt-get update -qq && apt-get upgrade -y -qq

# 2. Instalar Docker
echo "[2/6] Instalando Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "Docker instalado."
else
  echo "Docker já instalado."
fi

# 3. Instalar docker-compose
echo "[3/6] Instalando docker-compose..."
if ! command -v docker-compose &> /dev/null; then
  apt-get install -y docker-compose-plugin 2>/dev/null || \
  curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
    -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose
  echo "docker-compose instalado."
else
  echo "docker-compose já instalado."
fi

# 4. Criar pastas necessárias
echo "[4/6] Criando diretórios..."
mkdir -p /iothub/{kafka,mongoDB,redis,zookeeper/{data,datalog}}
mkdir -p /iothub/{api/data,tracker-instruction-server,msg-dispatch-iothub}
mkdir -p /iothub/{dvr-upload/{logs,uploadFile},jimi-upload-process/{logs,uploadFile}}
mkdir -p /iothub/{tracker-gate-v1,tracker-gate-v541h,gate-iothub-c450}/logs
mkdir -p /iothub/iothub-media/{log,cer}
mkdir -p /iothub/{jimi-data,jimi-tracker-gate-upload,router/logs}
mkdir -p /iothub/license
echo "Diretórios criados."

# 5. Copiar arquivos
echo "[5/6] Copiando configuração..."
cp /root/iothub/docker-compose.yml /iothub/docker-compose.yml
cp /root/iothub/license/jimi-license.lic /iothub/license/jimi-license.lic
echo "Arquivos copiados."

# 6. Configurar firewall
echo "[6/6] Configurando firewall..."
ufw allow ssh
ufw allow 10088/tcp  # API principal
ufw allow 8881/tcp   # Media server HTTP-FLV
ufw allow 1936/tcp   # RTMP (câmera → servidor)
ufw allow 23010/tcp  # Upload de arquivos
ufw allow 21122/tcp  # Gateway JC400
ufw allow 9080/tcp   # API interna
ufw --force enable
echo "Firewall configurado."

# 7. Iniciar serviços
echo ""
echo "================================================"
echo " Baixando imagens e iniciando serviços..."
echo " (pode levar 5-10 minutos na primeira vez)"
echo "================================================"
cd /iothub
docker compose up -d 2>/dev/null || docker-compose up -d

echo ""
echo "================================================"
echo " INSTALAÇÃO CONCLUÍDA!"
echo "================================================"
echo ""
echo " Endereços para configurar no painel:"
echo "   API:          http://$IP_SERVIDOR:10088"
echo "   Media Server: http://$IP_SERVIDOR:8881"
echo "   Arquivos:     http://$IP_SERVIDOR:23010"
echo ""
echo " Para ver status dos serviços:"
echo "   docker compose ps"
echo ""
echo " Para ver logs:"
echo "   docker compose logs -f api"
echo "================================================"

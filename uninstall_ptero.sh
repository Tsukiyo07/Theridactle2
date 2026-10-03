#!/bin/bash

echo "Uninstalling Pterodactyl Panel, Wings, services, database, and tunnels..."

# 1. Stop and delete PM2 tunnel
pm2 delete pterodactyl-tunnel 2>/dev/null || true
pm2 save

# 2. Stop and remove Wings systemd service and files
systemctl stop wings 2>/dev/null || true
systemctl disable wings 2>/dev/null || true
rm -f /etc/systemd/system/wings.service
rm -rf /etc/pterodactyl /usr/local/bin/wings

# 3. Stop and remove Pteroq queue service
systemctl stop pteroq 2>/dev/null || true
systemctl disable pteroq 2>/dev/null || true
rm -f /etc/systemd/system/pteroq.service

# 4. Remove Panel files and Nginx configs
rm -rf /var/www/pterodactyl
rm -f /etc/nginx/sites-available/pterodactyl.conf /etc/nginx/sites-enabled/pterodactyl.conf
systemctl reload nginx 2>/dev/null || true

# 5. Drop MySQL database and users
mysql -e "DROP DATABASE IF EXISTS panel; DROP USER IF EXISTS 'pterodactyl'@'localhost'; DROP USER IF EXISTS 'pterodactyl'@'127.0.0.1'; DROP USER IF EXISTS 'pterodactyluser'@'%'; DROP USER IF EXISTS 'pterodactyluser'@'localhost'; FLUSH PRIVILEGES;" 2>/dev/null || true

# 6. Remove Pterodactyl monitors from Uptime Kuma
docker exec uptime-kuma sqlite3 /app/data/kuma.db "DELETE FROM monitor WHERE name LIKE '%Pterodactyl%';" 2>/dev/null || true
docker restart uptime-kuma 2>/dev/null || true

echo "Pterodactyl uninstalled successfully!"

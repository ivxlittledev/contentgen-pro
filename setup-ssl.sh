#!/bin/bash

echo "🔒 Configuration SSL pour ContentGen Pro"
echo "========================================"

VPS_IP="69.62.126.243"

# Configuration SSL sur le VPS
ssh root@${VPS_IP} << 'ENDSSH'
echo "🌐 Installation Certbot et configuration SSL..."

# Installation Certbot si pas déjà fait
apt update
apt install -y certbot python3-certbot-nginx

# Configuration du domaine dans Nginx
cat > /etc/nginx/sites-available/contentgen << 'EOF'
server {
    listen 80;
    server_name 69.62.126.243;

    # Redirection forcée vers HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 69.62.126.243;

    # Configuration SSL (sera complétée par Certbot)
    ssl_certificate /etc/letsencrypt/live/69.62.126.243/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/69.62.126.243/privkey.pem;
    
    # Options SSL sécurisées
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend React (statique)
    location / {
        root /var/www/contentgen-pro/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache pour les assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Backend (proxy vers Node.js)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Logs
    access_log /var/log/nginx/contentgen-access.log;
    error_log /var/log/nginx/contentgen-error.log;
}
EOF

# Test et reload Nginx
nginx -t && systemctl reload nginx

# Génération du certificat SSL automatique
echo "🔐 Génération du certificat SSL..."
certbot --nginx -d 69.62.126.243 --non-interactive --agree-tos --email admin@contentgen-pro.com --redirect

# Configuration du renouvellement automatique
echo "⏰ Configuration du renouvellement automatique..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Test du certificat
echo "✅ Test du certificat SSL..."
certbot certificates

# Redémarrage final
systemctl reload nginx

echo "🎉 SSL configuré avec succès !"
echo "🌐 Votre site est maintenant accessible en HTTPS :"
echo "   https://69.62.126.243"
echo ""
echo "🔒 Sécurité mise en place :"
echo "   ✅ Redirection HTTP -> HTTPS forcée"
echo "   ✅ Headers de sécurité"
echo "   ✅ Renouvellement automatique du certificat"
ENDSSH

echo "✅ Configuration SSL terminée !"
echo "🌐 Votre site est maintenant sécurisé : https://69.62.126.243"
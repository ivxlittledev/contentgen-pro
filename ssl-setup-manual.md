# Configuration SSL pour ContentGen Pro

## Instructions pour activer HTTPS

### 1. Connectez-vous au VPS
```bash
ssh root@69.62.126.243
```

### 2. Installez Certbot
```bash
apt update
apt install -y certbot python3-certbot-nginx
```

### 3. Configurez Nginx pour SSL
```bash
cat > /etc/nginx/sites-available/contentgen << 'EOF'
server {
    listen 80;
    server_name 69.62.126.243;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 69.62.126.243;

    # Configuration SSL
    ssl_certificate /etc/letsencrypt/live/69.62.126.243/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/69.62.126.243/privkey.pem;
    
    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend React
    location / {
        root /var/www/contentgen-pro/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
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
    }
}
EOF
```

### 4. Générez le certificat SSL
```bash
nginx -t && systemctl reload nginx
certbot --nginx -d 69.62.126.243 --non-interactive --agree-tos --email admin@contentgen-pro.com --redirect
```

### 5. Configurez le renouvellement automatique
```bash
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
```

### 6. Redémarrez Nginx
```bash
systemctl reload nginx
```

## Résultat

Votre site sera accessible en HTTPS : **https://69.62.126.243**

## Comptes de test

- **Super Admin**: admin / admin123
- **Manager**: manager / manager123  
- **Rédacteur**: redacteur / redacteur123
module.exports = {
  apps: [
    {
      name: 'contentgen-backend',
      script: '/var/www/contentgen-pro/backend/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_file: '/var/log/pm2/contentgen-backend.log',
      out_file: '/var/log/pm2/contentgen-backend-out.log',
      error_file: '/var/log/pm2/contentgen-backend-error.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
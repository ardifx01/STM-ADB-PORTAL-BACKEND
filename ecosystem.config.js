module.exports = {
  apps: [{
    name: 'stmadb-portal-be',
    script: 'src/server.js',
    instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
    exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
    watch: process.env.NODE_ENV !== 'production',
    watch_delay: 1000,
    ignore_watch: [
      'node_modules',
      'logs',
      'uploads',
      '.git',
      'tests'
    ],
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};

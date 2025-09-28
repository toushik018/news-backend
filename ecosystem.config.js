module.exports = {
    apps: [
        {
            name: "dmwv-news-backend",
            script: "dist/server.js",
            instances: 1,
            exec_mode: "fork",
            env: {
                NODE_ENV: "production",
            },
            env_production: {
                NODE_ENV: "production",
            },
            error_file: "./logs/err.log",
            out_file: "./logs/out.log",
            log_file: "./logs/combined.log",
            time: true,
            merge_logs: true,
            max_memory_restart: "1G",
            restart_delay: 4000,
            autorestart: true,
            watch: false,
            max_restarts: 10,
            min_uptime: "10s",
        },
    ],
};
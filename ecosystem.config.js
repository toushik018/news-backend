module.exports = {
    apps: [
        {
            name: "multilingual-news-api",
            script: "dist/server.js",
            instances: "max",
            exec_mode: "cluster",
            env: {
                NODE_ENV: "production",
                PORT: 5000,
            },
            env_production: {
                NODE_ENV: "production",
                PORT: 5000,
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
module.exports = {
  apps: [
    {
      name: "umis-frontend",
      script: ".next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        NODE_TLS_REJECT_UNAUTHORIZED: "0",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};

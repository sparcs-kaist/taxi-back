module.exports = {
  apps: [
    {
      name: "taxi-back",
      script: "./app.js",
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};

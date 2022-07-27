module.exports = {
  apps: [
    {
      name: "taxi-back",
      script: "./app.js",
      error_file: "./logs/error.log",
      out_file: "./logs/combined.log",
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};

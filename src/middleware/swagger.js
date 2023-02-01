const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggereJsdoc = require('swagger-jsdoc');

// https://github.com/Surnet/swagger-jsdoc

const swaggerProvider = (options) => {
  const router = express.Router();
  const options = {
    definition: {
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'Test API with express',
      },
      basePath: '/',
      ...options,
    },
    apis: ['./routes/*.js']
  };

  router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggereJsdoc(options)));

  return router;
}

module.exports = swaggerProvider;

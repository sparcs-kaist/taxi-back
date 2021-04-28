const express = require('express');
const router = express.Router();

module.exports = (mongo) => {
  router.get('/', function(req, res, next) {
    res.send("hi rooms router");
  });
  
  return router;
}
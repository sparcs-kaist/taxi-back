var express = require('express');
var mongo = require('../db/mongo');
var router = express.Router();

router.get('/', function(req, res, next) {
  mongo.connectDB();
});

module.exports = router;

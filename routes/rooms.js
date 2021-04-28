const express = require('express');
const mongo = require('../db/mongo');
// suwon : mongo 반복호출 일어나니 이중함수 사용 제안
const router = express.Router();

router.get('/', function(req, res, next) {
  res.send("hi rooms router");
});

module.exports = router;

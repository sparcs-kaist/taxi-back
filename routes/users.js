const express = require('express');
const mongo = require('../db/mongo');
const mongoose = require('mongoose');
const router = express.Router();



/* GET users listing. */
router.get('/', function(req, res){
  const databaseUrl = "mongodb://localhost/users"
  mongoose.connect(databaseUrl, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
  const db = mongoose.connection;
  mongo.userModel.find({}, function(err, result){
    if(err) throw err;
    if(result) {
      //console.log(result);
      res.json(result);
    } else {
      res.send(JSON.stringify({
        error: 'Error'
      }))
    }
  })
})


router.get('/createUser', function(req, res, next) {
  const simpleUser = new mongo.userModel({
    name: 'dogma_mk3',
    id: 'mymymy',
    joinat: '2020-02-28'
  });
  simpleUser.save(function(err){
    if(err){
      console.log(err);
      return res.end(err);
    }
  });
  res.end("successfully created dogma");
});

module.exports = router;

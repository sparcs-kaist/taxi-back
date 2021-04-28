const express = require('express');
const mongo = require('../db/mongo');
const mongoose = require('mongoose');
const router = express.Router();



/* GET users listing. */
router.get('/', function(req, res){
  mongo.userModel.find({}, function(err, result){
    if(err) throw err;
    if(result) {
      res.json(result);
      //console.log(result);
    }
  })
})


router.post('/new', function(req, res, next) { 
  // req.body 는 name/id/pw/joinat 을 포함한 json이어야 한다.
  const created_user = new mongo.userModel(req.body);
  created_user.save(function(err){
    if(err){
      console.log(err);
      return res.end(err);
    }
  });
  res.end("successfully created "+req.body.id);
});

router.post('/login', function(req, res) {
  let result = mongo.userModel.findOne({"id": req.body.id},(err, result) => {
    console.log(result);
    if(err) {
      console.log(err);
      throw err;
    }
    if (result){
      if(req.body.password.toString() === result.password){
        res.send("successful")
      }else{
        res.send("password wrong")
      }
    }else{
      res.send("no such id");
    }
  });
    
    
  
});

module.exports = router;

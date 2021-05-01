const express = require('express');
const router = express.Router();

module.exports = (mongo) => {
  router.get('/', function(req, res, next) {
    res.send("hi rooms router");
  });

  router.post('/newtaxi').post(function(req,res){
    console.log(req.body);
  
    let room = new mongo.roomModel({'name':req.body.name, 'from':req.body.from, 'to':req.body.to, 'time':req.body.time, 'part':req.body.part, 'madeat':req.body.madeat});
    room.save()
    .then(room => {
        res.status(200).json({'class': 'class added successfully'});
    })
    .catch(err => {
        res.status(400).send('adding new class failed');
        console.log(err);
    });
  })
  
  return router;
}
const express = require('express');
const { locationModel } = require('../db/mongo');
const router = express.Router();

module.exports = (mongo) => {
  router.get('/', function(req, res, next) {
    res.send("hi rooms router");
  });

  router.route('/create').post(function(req,res){
    console.log(req.body);
    
    locationModel.exists({"name":req.body.from}, function(err,result){
      if (result == false){
        let location_from = new mongo.locationModel({'name':req.body.from})
        location_from.save();
      }
      else if (result == true){
        let location= locationModel.findOne({"name":req.body.from});
      }
    })

    locationModel.exists({"name":req.body.to}, function(err,result){
      if (result == false){
        let location_to = new mongo.locationModel({'name':req.body.to})
        location_to.save();
      }
      else if (result == true){
        let location_to= locationModel.findOne({"name":req.body.to});
      }
    })


    let room = new mongo.roomModel({'name':req.body.name, 'from':location_from._id, 'to':location_to._id, 'time':req.body.time, 'part':req.body.part, 'madeat':Date.now()});
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
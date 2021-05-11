const express = require('express');
const { locationModel } = require('../db/mongo');
const router = express.Router();
module.exports = (mongo) => {
  router.get('/', function(req, res, next) {
    res.send("hi rooms router");
  });

  router.route('/create').post(function(req,res){
    //console.log(req.body);
    
   mongo.locationModel.findOneAndUpdate({"name":req.body.from},{}, {upsert:true}, (err, result1) => {
	let from = result1._id;
   	mongo.locationModel.findOneAndUpdate({"name":req.body.to},{}, {upsert:true}, (err,result2)=> {
	

	let to = result2._id;


        let room = new mongo.roomModel({'name':req.body.name, 'from':from, 'to':to, 'time':req.body.time, 'part':req.body.part, 'madeat':Date.now()});
    	console.log(room)
	room.save()
    	.then(room => {
        	res.status(200).json({'class': 'class added successfully'});
   	 })
    	.catch(err => {
        	res.status(400).send('adding new class failed');
        	console.log(err);
    	});


   })})
  });
  return router;
}

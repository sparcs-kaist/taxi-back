const express = require('express');
const { locationModel } = require('../db/mongo');
const router = express.Router();
const loginCheckMiddleware = require('../middleware/logincheck')

module.exports = (mongo) => {
  // router.get('/', function(_, _) {
  //   router.use(loginCheckMiddleware);
  // });

  router.get('/getAllRoom', (_, res) => {
    console.log('/getAllRoom called');
    mongo.roomModel.find({})
    .then( 
      async (results) => {

        jsonResult = await JSON.parse(JSON.stringify(results));
        console.log(jsonResult)
        for (const result of jsonResult) {
          let fromLocation = await mongo.locationModel.findById( result.from );
          result.from = fromLocation.name;
          let toLocation = await mongo.locationModel.findById( result.to );
          result.to = toLocation.name;
        }
        // await jsonResult.map( async result => {
          
        // })
        res.send( jsonResult );
      }
    )
  })

  router.route('/create').post(function(req,res){
    //console.log(req.body);
    mongo.locationModel.findOneAndUpdate({"name":req.body.from},{}, {upsert:true}, (err, result1) => {
      if (err) {
        console.log(err);
        throw err;
      } else {
        let from = result1._id;
   	    mongo.locationModel.findOneAndUpdate({"name":req.body.to},{}, {upsert:true}, (err,result2)=> {
          if (err) {
            console.log(err);
            throw err;
          }
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
        })
      }
    })
  });

  router.get('/:id/delete', (req, res) => {
    mongo.roomModel.deleteOne({"id": req.params.id}, (err, result) => {
      if(err) {
        console.log(err);
        throw err;
      }
      if(result) {
        res.send("successful");
      }
    })
  })

  router.post('/:id/edit', (req, res) => {
    mongo.roomModel.findOne({"id": req.params.id}, (err, result) => {
      if (err) {
        console.log(err);
        throw err;
      }
      if (result) {
        const updateVal = {$set : req.body};
        mongo.roomModel.updateOne( {"id": req.params.id}, (err, result) => {
          if (err) {
            console.log(err);
            throw err;
          }
          if (result) {
            console.log("roomEdit successful");
            res.send("successful");
          }
        })
      }
    })
  })

  // 특정 id 방 세부사항 보기
  router.get('/:id', (req, res) => {
    mongo.roomModel.findById( req.params.id )
    .then(
      (result) => {
        console.log(JSON.stringify(result))
        res.send(JSON.stringify(result));
      }
    )
    .catch(
      (err) => { console.log(err); throw err; }
    )
  })
  
  return router;
}

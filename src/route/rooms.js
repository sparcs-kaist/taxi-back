const express = require('express');
const { locationModel } = require('../db/mongo');
const router = express.Router();
const loginCheckMiddleware = require('../middleware/logincheck')
const objectId = require('mongodb').ObjectID;

module.exports = (mongo) => {
  router.get('/', function(_, _) {
    router.use(loginCheckMiddleware);
  });

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

  router.route('/create').post(async function(req, res){
    //console.log(req.body);
    let from = await mongo.locationModel.findOneAndUpdate({"name":req.body.from},{}, {upsert:true})
   	let to = await mongo.locationModel.findOneAndUpdate({"name":req.body.to},{}, {upsert:true})
    let room = new mongo.roomModel({
      'name':req.body.name,
      'from':from._id,
      'to':to._id,
      'time':req.body.time,
      'part':req.body.part,
      'madeat':Date.now()
    })
    room.save()
    .then(room => {
      res.status(200).send('adding room successful')
    })
    .catch(err => {
      res.status(500).send('adding room failed');
      console.log(err);
    });
  });

  router.get('/:id/delete', (req, res) => {
    console.log("room delete : "+req.params.id)
    mongo.roomModel.findByIdAndRemove( req.params.id )
    .then( result => {
      if(result) {
        console.log(result);
        res.status(200).send('delete room successful')
      } else {
        console.log("room delete error : id does not exist");
        res.status(400).send("such id does not exist");
      }
    })
    // catch는 반환값이 없을 경우(result == undefined일 때)는 처리하지 않는다.
    .catch( error => {
      console.log(error);
      throw error;
    })
    
  })

  // json으로 수정할 값들을 받는다
  router.post('/:id/edit', (req, res) => {
    mongo.roomModel.findByIdAndUpdate( req.params.id, {$set : req.body} )
    .then( result => {
      if(result){
        console.log("edit room successful")
        res.status(200).send('edit room successful')
      } else {
        console.log("room delete error : id does not exist");
        res.status(400).send("such id does not exist");
      }
    })
    .catch( error => {
      console.log("room edit error : " +error);
      throw error;
    })
  })

  // 특정 id 방 세부사항 보기
  router.get('/:id', (req, res) => {
    mongo.roomModel.findById( req.params.id )
    .then( result => {
        if(result) {
          console.log(JSON.stringify(result))
          res.send(JSON.stringify(result));
        } else {
          console.log("room info error : id does not exist")
          res.status(400).send("such id does not exist");
        }
      })
    .catch( err => { console.log(err); throw err; })
  })
  
  return router;
}

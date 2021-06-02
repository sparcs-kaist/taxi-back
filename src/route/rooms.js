const express = require('express');
const { stringify } = require('querystring');
const { locationModel } = require('../db/mongo');
const router = express.Router();
const loginCheckMiddleware = require('../middleware/logincheck')

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

  router.post('/create', async (req, res) => {
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

  // Request JSON form
  // { roomId : ObjectID,
  //   users : List[ObjectID] }
  router.post('/invite', async (req, res) => {
    // Request JSON Validation
    if( !req.body.roomId || !req.body.users ) res.status("400").send("Room/invite : Bad request")

    try {
      let room = await mongo.roomModel.findById( req.body.roomId )
      if ( !room ) res.status(400).send("Room/invite : no corresponding room")
      for( const userID of req.body.users ){
        if ( room.part.includes(userID) ) res.status("400").send("Room/invite : "+ userID +" Already in room")
      }
      await room.save()
      for ( const userID of req.body.users ){
        room.part.append(userID)
        let user = await mongo.userModel.findById( userID )
        user.room.append( req.body.roomId )
        await user.save()
      }
      res.status("200").send("Room/invite : Successful")
    } catch ( error ) {
      console.log(error);
      res.status("500").send("Room/invite : Error 500")
    }
  })

  // Request JSON Form
  // {
  //   fromName : String,
  //   toName : String,
  //   startDate : Date,
  //   roomName : String
  // }

  // 방 이름이 있다면 방 이름으로만 검색
  // 없다면 나머지 조건으로
  // 최소한 하나의 조건은 있어야 함.
  router.post('/search', async (req, res) => {
    if ( !req.body.fromName && !req.body.toName && !req.body.startDate && !req.body.roomName ) {
      res.status("400").send(JSON.stringify({
        error : true,
        message : "Room/search : Bad request, not enough info"
      }))
    }
    if ( req.body.roomName && ( req.body.fromName || req.body.toName || req.body.startDate )) {
      rres.status("400").send(JSON.stringify({
        error : true,
        message : "Room/search : Bad request, too many info"
      }))
    }
    if ( !req.body.roomName && (( req.body.fromName && !req.body.toName) || ( !req.body.fromName && req.body.toName ))){
      res.status("400").send(JSON.stringify({
        error : true,
        message : "Room/search : Bad request, from and to must be given together"
      }))
    }

    try {
      if ( req.body.roomName ){
        let rooms = await mongo.roomModel.find({ name : { $regex : req.body.roomName, $options : "i" }})
        if (!rooms) res.status("404").send(JSON.stringify({
          error : true,
          message : "Room/search : No corresponding room"
        }))
        res.status("200").send(JSON.stringify(rooms))
      } else {
        let fromLocationID = (() => {if ( req.body.fromName ){
          let fromLocation = await mongo.locationModel.find({ name : req.body.fromName })
          return fromLocation._id
        }}) ()
        let toLocationID = (() => {if ( req.body.toName ){
          let toLocation = await mongo.locationModel.find({ name : req.body.toName })
          return toLocation._id
        }}) ()
        let rooms = await mongo.roomModel.find({})
        if ( fromLocationID && toLocationID ){
          rooms = await rooms.find({
            from : fromLocationID,
            to : toLocationID
          })
        }
        // date form 2012-04-23T18:25:43.511Z
        if ( startDate ){
          rooms = await rooms.find({
            
          })
        }
        
        if ( fromLocationID && toLocationID ){
          let rooms = await mongo.roomModel.find({
            from : fromLocationID,
            to : toLocationID
          })
          res.status("200").send(JSON.stringify(rooms))
        }

        res.status("404").send(JSON.stringify({
          error : true,
          message : "Room/search : No corresponding room"
        }))
      }
    } catch (error) {
      res.status("500").send(JSON.stringify({
        error : true,
        message : "Room/search : Internal server error"
      }))
    }

    
    
  })
  
  return router;
}

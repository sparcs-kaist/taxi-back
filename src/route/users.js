const express = require('express');
const router = express.Router();

module.exports = (mongo) => {
  /* GET users listing. */
  router.get('/', function(_, res){
    mongo.userModel.find({}, function(err, result){
      if(err) throw err;
      if(result) {
        res.json(result);
        //console.log(result);
      }
    })
  })

  router.get('/:id', async (req, res) => {
    try {
      let usr = await mongo.userModel.findById( req.params.id );
      if(usr) {
        res.status(200).send(JSON.stringify({
          error: false,
          data: usr
        }))
      } else {
        res.status(404).send(JSON.stringify({
          error: true,
          message: "user/:id : such id does not exist"
        }))
      }
    } catch (error) {
      console.log(error);
      res.status(500).send(JSON.stringify({
        error: true,
        message: "user/:id : internal server error"
      }))
    }
  })

  // json으로 수정할 값들을 받는다
  // replace/overwrite all user informations with given JSON
  router.post('/:id/edit', (req, res) => {
    mongo.userModel.findByIdAndUpdate( req.params.id, {$set : req.body} )
    .then( result => {
      if(result){
        console.log("edit user successful")
        res.status(200).send('edit user successful')
      } else {
        console.log("user delete error : id does not exist");
        res.status(400).send("such id does not exist");
      }
    })
    .catch( error => {
      console.log("user edit error : " +error);
      throw error;
    })
  })

  // 409 Conflict
  // This response is sent when a request conflicts with the current state of the server.
  router.get('/:id/ban', async (req, res) => {
    // mongo.userModel.findById( req.params.id )
    // .then( user => {
    //   if (user) {
    //     if (user.ban === false) {
    //       user.ban = true;
    //       user.save()
    //     } else {
    //       res.status(409).send("The user is already banned")
    //     }
    //   } else {
    //     res.status(400).send("The user does not exist")
    //   }
    // })
    // .then( user => {
    //   console.log(user);
    //   res.status(200).send("The user banned successfully")
    // })
    // .catch( err => {
    //   console.log(err);
    //   throw err;
    // })

    let user = await mongo.userModel.findById( req.params.id )
    if( user ) {
      if (user.ban === false) {
        user.ban = true;
        try {
          await user.save()
          console.log(user);
          res.status(200).send("The user banned successfully")
        } catch (error) {
          console.log(err);
          throw err;
        }
      } else {
        res.status(409).send("The user is already banned")
      }
    } else {
      res.status(400).send("The user does not exist")
    }
  })

  router.get('/:id/unban', async (req, res) => {
    let user = await mongo.userModel.findById( req.params.id )
    if( user ) {
      if (user.ban === true) {
        user.ban = false;
        try {
          await user.save()
          console.log(user);
          res.status(200).send("The user unbanned successfully")
        } catch (error) {
          console.log(err);
          res.status(500).send("User/unban : Error 500")
        }
      } else {
        res.status(409).send("The user is already unbanned")
      }
    } else {
      res.status(400).send("The user does not exist")
    }
  })

  // Request JSON form
  // { room : [ObjectID] }
  router.post('/:id/participate', async (req, res) => {
    // request JSON validation
    if( !req.body.room ) res.status(400).send("User/participate : Bad request")

    // Validate whether a room ObjectID is valid or not
    // And add the user ObjectID to room participants list
    try {
      let room = await mongo.roomModel.findById( req.body.room )
      if ( !room ) res.status(400).send("User/participate : No corresponding room")
      room.part.append( req.params.id )
      await room.save()
    } catch(error) {
      console.log(error);
      res.status(500).send("User/participate : Error 500")
    }

    try {
      let user = await mongo.userModel.findById( req.params.id );
      if( !user ) res.status(400).send("The user does not exist")
      if( user.room.includes(req.body.room) ) res.status(409).send("The user already entered the room")
      user.room.append(req.body.room)
      await user.save()
      console.log(user)
      res.status(200).send("User/participate : Successful");
    } catch(error) {
      console.log(error);
      res.status(500).send("User/participate : Error 500")
    }
  })

  return router;
}

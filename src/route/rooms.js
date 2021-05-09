const express = require('express');
const router = express.Router();
const loginCheckMiddleware = require('../middleware/logincheck')

module.exports = (mongo, login) => {
  router.get('/', function(_, _) {
    router.use(loginCheckMiddleware);
  });

  router.post('/create', (req, res) => {
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
    mongo.roomModel.findOne({"id": req.params.id}, (err, result) => {
      if (err) {
        console.log(err);
        throw err;
      }
      if (result) {
        console.log(result);
        res.send(result);
      }
    });
  })
  
  return router;
}
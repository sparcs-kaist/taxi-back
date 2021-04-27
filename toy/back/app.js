const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const teamRoutes = express.Router();
const PORT = 3000;


let Class = require('./class');

app.use(cors());
app.use(bodyParser.json());
mongoose.connect('mongodb://localhost:27017/taxi', { useNewUrlParser: true ,useUnifiedTopolgy:true});
const connection = mongoose.connection;

teamRoutes.route('/newtaxi').post(function(req,res,next){
  console.log(req.body);

  let class1 = new Class({'name':req.body.name, 'from':req.body.from, 'to':req.body.to, 'time':req.body.time, 'part':req.body.part, 'madeat':req.vodt.madeat});
  class1.save()
  .then(class1 => {
      res.status(200).json({'class': 'class added successfully'});
  })
  .catch(err => {
      res.status(400).send('adding new class failed');
      console.log(err);
  });
})


app.use('/taxi', teamRoutes);
app.listen(PORT, function() {
  console.log("Server is running on Port: " + PORT);
});


const mongoose = require('mongoose');
const Schema =mongoose.Schema;

let Board= new Schema({
    writer:{ type: String,  required: true },
    boardtitle:{type:String},
    content: { type: String, unique: true, required: true },
});

module.exports = mongoose.model('Board',Board);
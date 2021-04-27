const mongoose = require('mongoose');
const Schema =mongoose.Schema;

const chatSchema = mongoose.Schema({
    content: { type: String, default: '' },
    sender: { type: schema.Types.ObjectId, required: true },
    sendat: { type: Date, required: true },
    room: { type: schema.Types.ObjectId, required: true },
    deleted: { type: Boolean, default: false }
});
module.exports = mongoose.model('Board',Board);
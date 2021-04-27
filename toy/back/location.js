const mongoose = require('mongoose');
const Schema =mongoose.Schema;

const locationSchema = mongoose.Schema({
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
});

module.exports = mongoose.model('Location',location);
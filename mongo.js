const mongoose = require('mongoose');
const schema = mongoose.Schema;
var security = require('./security');

var userSchema = mongoose.Schema({
    name: { type: String, required: true },
    // 구분 아이디
    withdraw: { type: Boolean, default: false },
    ban: { type: Boolean, default: false },
    joinat: { type: Date, required: true },
    room: { type: Array, default: [] }
});
var roomSchema = mongoose.Schema({
    name: { type: String, required: true, default: '이름 없음' },
    from: { type: schema.Types.ObjectId, required: true }, // obj id로?
    to: { type: schema.Types.ObjectId, required: true }, // obj id로?
    time: { type: Date, required: true },
    part: { type: Array, default: [] },
    madeat: { type: Date, required: true }
});
var chatSchema = mongoose.Schema({
    content: { type: String, default: '' },
    sender: { type: schema.Types.ObjectId, required: true },
    sendat: { type: Date, required: true },
    room: { type: schema.Types.ObjectId, required: true },
    deleted: { type: Boolean, default: false }
});
var locationSchema = mongoose.Schema({
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
});

class MONGO{
    constructor(){
        this.connectDB();
    }
    connectDB(){
        var parent = this;

        console.log('데이터베이스 연결을 시도합니다.');
        var databaseUrl = security.mongo;
        mongoose.Promise = global.Promise;
        mongoose.connect(databaseUrl, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
        var database = mongoose.connection;

        database.on('error', console.error.bind(console,'mongoose connection error.'));
        database.on('open', function(){
            console.log('데이터베이스와 연결되었습니다.');

            parent.userModel = mongoose.model("users", userSchema);
            parent.roomModel = mongoose.model("rooms", roomSchema);
            parent.chatModel = mongoose.model("chats", chatSchema);
            parent.locationModel = mongoose.model("locations", locationSchema);
        });
        database.on('disconnected', function(){
            console.log('데이터베이스와 연결이 끊어졌습니다. 5초 후 다시 연결합니다.');
            setInterval(parent.connectDB, 5000);
        });
    }
}

module.exports = new MONGO();
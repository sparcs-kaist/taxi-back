const mongoose = require('mongoose');
const schema = mongoose.Schema;
const security = require('../../security');

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    withdraw: { type: Boolean, default: false },
    ban: { type: Boolean, default: false },
    joinat: { type: Date, required: true },
    room: { type: Array, default: [] },
    subinfo: {
        kaist: { type: String, default: '' },
        sparcs: { type: String, default: '' },
        facebook: { type: String, default: '' },
        twitter: { type: String, default: '' },
    }
});
const roomSchema = mongoose.Schema({
    name: { type: String, required: true, default: '이름 없음' },
    from: { type: schema.Types.ObjectId, required: true }, // obj id로?
    to: { type: schema.Types.ObjectId, required: true }, // obj id로?
    time: { type: Date, required: true }, 
    part: { type: Array, default: [] }, 
    madeat: { type: Date, required: true } // 
});
const chatSchema = mongoose.Schema({
    content: { type: String, default: '' },
    sender: { type: schema.Types.ObjectId, required: true },
    sendat: { type: Date, required: true },
    room: { type: schema.Types.ObjectId, required: true },
    deleted: { type: Boolean, default: false }
});
const locationSchema = mongoose.Schema({
    name: { type: String, required: true },
 //   latitude: { type: Number, required: true },
   // longitude: { type: Number, required: true }
});

class Mongo{
    constructor(){
        this.connectDB();
    }
    connectDB(){
        console.log('데이터베이스 연결을 시도합니다.');
        const databaseUrl = security.mongo;
        mongoose.connect(databaseUrl, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

        const database = mongoose.connection;
        database.on('error', console.error.bind(console,'mongoose connection error.'));
        database.on('open', () => {
            console.log('데이터베이스와 연결되었습니다.');

            this.userModel = mongoose.model("users", userSchema);
            this.roomModel = mongoose.model("rooms", roomSchema);
            this.chatModel = mongoose.model("chats", chatSchema);
            this.locationModel = mongoose.model("locations", locationSchema);
        });
        database.on('disconnected', () => {
            console.log('데이터베이스와 연결이 끊어졌습니다. 5초 후 다시 연결합니다.');
            setTimeout(this.connectDB, 5000);
        });
    }
}

module.exports = new Mongo();

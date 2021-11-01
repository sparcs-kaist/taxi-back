const mongoose = require("mongoose");
const schema = mongoose.Schema;
const security = require("../../security");

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  nickname: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  profileImgUrl: { type: String, required: true },
  withdraw: { type: Boolean, default: false },
  ban: { type: Boolean, default: false },
  joinat: { type: Date, required: true },
  room: { type: Array, default: [] },
  subinfo: {
    kaist: { type: String, default: "" },
    sparcs: { type: String, default: "" },
    facebook: { type: String, default: "" },
    twitter: { type: String, default: "" },
  },
});
const roomSchema = mongoose.Schema({
  name: { type: String, required: true, default: "이름 없음" },
  from: { type: schema.Types.ObjectId, required: true },
  to: { type: schema.Types.ObjectId, required: true },
  time: { type: Date, required: true }, // 출발 시간
  part: { type: Array, default: [] }, // 참여 멤버
  madeat: { type: Date, required: true }, // 생성 날짜
});
const chatSchema = mongoose.Schema({
  content: { type: String, default: "" },
  sender: { type: schema.Types.ObjectId, required: true },
  sendat: { type: Date, required: true },
  room: { type: schema.Types.ObjectId, required: true },
  deleted: { type: Boolean, default: false },
});
const locationSchema = mongoose.Schema({
  name: { type: String, required: true },
  //   latitude: { type: Number, required: true },
  // longitude: { type: Number, required: true }
});
const chatRoomSchema = new mongoose.Schema({
  _id: Number,
  chats: [
    {
      author: String,
      text: String,
      time: Date,
    },
  ],
});

mongoose.set("useFindAndModify", false);

const database = mongoose.connection;
database.on("error", console.error.bind(console, "mongoose connection error."));
database.on("open", () => {
  console.log("데이터베이스와 연결되었습니다.");
});
database.on("error", function (err) {
  console.error("데이터베이스 연결 에러 발생: " + err);
  mongoose.disconnect();
});
database.on("disconnected", function () {
  console.log("데이터베이스와 연결이 끊어졌습니다!");
  mongoose.connect(security.mongo, { server: { auto_reconnect: true } });
});

mongoose.connect(security.mongo, { server: { auto_reconnect: true } });

module.exports = {
  userModel: mongoose.model("users", userSchema),
  roomModel: mongoose.model("rooms", roomSchema),
  chatModel: mongoose.model("chats", chatSchema),
  locationModel: mongoose.model("locations", locationSchema),
  chatRoomModel: mongoose.model("chatRooms", chatRoomSchema),
};

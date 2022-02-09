const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const security = require("../../security");

const userSchema = Schema({
  name: { type: String, required: true }, //실명
  nickname: { type: String, required: true }, //닉네임
  id: { type: String, required: true, unique: true }, //택시 서비스에서만 사용되는 id
  profileImageUrl: { type: String, required: true }, //백엔드에서의 프로필 이미지 경로
  room: [{ type: Schema.Types.ObjectId, ref: "Room" }], //참여중인 방 배열
  withdraw: { type: Boolean, default: false },
  ban: { type: Boolean, default: false },
  joinat: { type: Date, required: true },
  subinfo: {
    kaist: { type: String, default: "" },
    sparcs: { type: String, default: "" },
    facebook: { type: String, default: "" },
    twitter: { type: String, default: "" },
  },
});
const roomSchema = Schema({
  name: { type: String, required: true, default: "이름 없음" },
  from: { type: Schema.Types.ObjectId, ref: "Location", required: true },
  to: { type: Schema.Types.ObjectId, ref: "Location", required: true },
  time: { type: Date, required: true }, // 출발 시간
  part: [{ type: Schema.Types.ObjectId, ref: "User" }], // 참여 멤버
  madeat: { type: Date, required: true }, // 생성 날짜
});
const locationSchema = Schema({
  name: { type: String, required: true },
  //   latitude: { type: Number, required: true },
  // longitude: { type: Number, required: true }
});
const chatSchema = Schema({
  roomId: { type: Schema.Types.ObjectId, required: true },
  authorId: { type: Schema.Types.ObjectId, required: true },
  authorName: { type: String, required: true },
  text: { type: String, default: "" },
  time: { type: Date, required: true },
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
  mongoose.connect(security.mongo, {
    auto_reconnect: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  });
});

mongoose.connect(security.mongo, {
  auto_reconnect: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

module.exports = {
  userModel: mongoose.model("User", userSchema),
  roomModel: mongoose.model("Room", roomSchema),
  locationModel: mongoose.model("Location", locationSchema),
  chatModel: mongoose.model("Chat", chatSchema),
};

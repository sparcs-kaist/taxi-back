const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const security = require("../../security");
const logger = require("../modules/logger");

const userSchema = Schema({
  name: { type: String, required: true }, //실명
  nickname: { type: String, required: true }, //닉네임
  id: { type: String, required: true, unique: true }, //택시 서비스에서만 사용되는 id
  profileImageUrl: { type: String, required: true }, //백엔드에서의 프로필 이미지 경로
  ongoingRoom: [{ type: Schema.Types.ObjectId, ref: "Room" }], // 참여중인 진행중인 방 배열
  doneRoom: [{ type: Schema.Types.ObjectId, ref: "Room" }], // 참여중인 완료된 방 배열
  withdraw: { type: Boolean, default: false },
  ban: { type: Boolean, default: false }, //계정 정지 여부
  joinat: { type: Date, required: true }, //가입 시각
  agreeOnTermsOfService: { type: Boolean, default: false }, //이용약관 동의 여부
  subinfo: {
    kaist: { type: String, default: "" },
    sparcs: { type: String, default: "" },
    facebook: { type: String, default: "" },
    twitter: { type: String, default: "" },
  },
  email: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }, //관리자 여부
  account: { type: String, default: "" }, //계좌번호 정보
});

const participantSchema = Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  settlementStatus: {
    type: String,
    required: true,
    enum: ["not-departed", "paid", "send-required", "sent"],
    default: "not-departed",
  },
});

const deviceTokenSchema = Schema({
  userid: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  deviceToken: [{ type: String, required: true }],
});

const roomSchema = Schema({
  name: { type: String, required: true, default: "이름 없음", text: true },
  from: { type: Schema.Types.ObjectId, ref: "Location", required: true },
  to: { type: Schema.Types.ObjectId, ref: "Location", required: true },
  time: { type: Date, required: true }, // 출발 시간
  part: {
    type: [participantSchema],
    validate: [
      function (value) {
        return value.length <= this.maxPartLength;
      },
    ],
  }, // 참여 멤버 및 정산 여부
  madeat: { type: Date, required: true }, // 생성 날짜
  settlementTotal: { type: Number, default: 0, required: true },
  maxPartLength: { type: Number, require: true, default: 4 },
});

const locationSchema = Schema({
  enName: { type: String, required: true },
  koName: { type: String, required: true },
  priority: { type: Number, default: 0 },
  isValid: { type: Boolean, default: true },
  // latitude: { type: Number, required: true },
  // longitude: { type: Number, required: true }
});
const chatSchema = Schema({
  roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
  type: { type: String, enum: ["text", "in", "out", "s3img"] }, // 메시지 종류
  authorId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // 작성자 id
  content: { type: String, default: "" },
  time: { type: Date, required: true },
  isValid: { type: Boolean, default: true },
});
chatSchema.index({ roomId: 1, time: -1 });

const reportSchema = Schema({
  creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // 신고한 사람 id
  reportedId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // 신고받은 사람 id
  type: {
    type: String,
    enum: ["no-settlement", "no-show", "etc-reason"],
    required: true,
  },
  etcDetail: { type: String, default: "" }, // 기타 세부 사유
  time: { type: Date, required: true },
});

const adminIPWhitelistSchema = Schema({
  ip: { type: String, required: true }, // IP 주소
  description: { type: String, default: "" }, // 설명
});

const database = mongoose.connection;
database.on("error", console.error.bind(console, "mongoose connection error."));
database.on("open", () => {
  logger.info("데이터베이스와 연결되었습니다.");
});
database.on("error", function (err) {
  logger.error("데이터베이스 연결 에러 발생: " + err);
  mongoose.disconnect();
});
database.on("disconnected", function () {
  // 데이터베이스 연결이 끊어지면 5초 후 재연결을 시도합니다.
  logger.error("데이터베이스와 연결이 끊어졌습니다!");
  setTimeout(() => {
    mongoose.connect(security.mongo, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }, 5000);
});

mongoose.connect(security.mongo, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = {
  userModel: mongoose.model("User", userSchema),
  deviceTokenModel: mongoose.model("DeviceToken", deviceTokenSchema),
  roomModel: mongoose.model("Room", roomSchema),
  locationModel: mongoose.model("Location", locationSchema),
  chatModel: mongoose.model("Chat", chatSchema),
  reportModel: mongoose.model("Report", reportSchema),
  adminIPWhitelistModel: mongoose.model(
    "AdminIPWhitelist",
    adminIPWhitelistSchema
  ),
};

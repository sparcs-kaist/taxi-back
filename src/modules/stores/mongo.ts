import mongoose, { model, Schema, Types } from "mongoose";
import logger from "@/modules/logger";
import type {
  User,
  Participant,
  DeviceToken,
  NotificationOption,
  TopicSubscription,
  Room,
  Location,
  Chat,
  Report,
  AdminIPWhitelist,
  AdminLog,
} from "@/types/mongo";

const userSchema = new Schema<User>({
  name: { type: String, required: true }, //실명
  nickname: { type: String, required: true }, //닉네임
  id: { type: String, required: true, unique: true }, //택시 서비스에서만 사용되는 id
  profileImageUrl: { type: String, required: true }, //백엔드에서의 프로필 이미지 경로
  ongoingRoom: [{ type: Schema.Types.ObjectId, ref: "Room" }], // 참여중인 진행중인 방 배열
  doneRoom: [{ type: Schema.Types.ObjectId, ref: "Room" }], // 참여중인 완료된 방 배열
  withdraw: { type: Boolean, default: false },
  phoneNumber: { type: String }, // 전화번호 (2023FALL 이벤트부터 추가)
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

export const userModel = model("User", userSchema);

const participantSchema = new Schema<Participant>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  settlementStatus: {
    type: String,
    required: true,
    enum: ["not-departed", "paid", "send-required", "sent"],
    default: "not-departed",
  },
  readAt: { type: Date },
});

const deviceTokenSchema = new Schema<DeviceToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  deviceTokens: [{ type: String, required: true }],
});

export const deviceTokenModel = model("DeviceToken", deviceTokenSchema);

// 각 디바이스의 알림 설정
const notificationOptionSchema = new Schema<NotificationOption>({
  deviceToken: {
    type: String,
    required: true,
    unique: true,
  },
  chatting: {
    type: Boolean,
    default: true,
    required: true,
  }, //채팅 알림 수신 여부
  keywords: [
    {
      type: String,
      required: true,
    },
  ], //방 알림 키워드
  beforeDepart: {
    type: Boolean,
    required: true,
    default: false,
  }, //출발 전 알림 발송 유무
  notice: {
    type: Boolean,
    default: true,
    required: true,
  }, //공지 알림 수신 여부
  advertisement: {
    type: Boolean,
    default: false,
    required: true,
  }, //광고성 알림 수신 여부
});

export const notificationOptionModel = model(
  "NotificationOption",
  notificationOptionSchema
);

const topicSubscriptionSchema = new Schema<TopicSubscription>({
  deviceToken: String,
  topic: String,
  subscribedAt: {
    type: Date,
    default: () => Date.now(),
    required: true,
  },
});

export const topicSubscriptionModel = model(
  "TopicSubscription",
  topicSubscriptionSchema
);

const roomSchema = new Schema<Room>({
  name: { type: String, required: true, default: "이름 없음", text: true },
  from: { type: Schema.Types.ObjectId, ref: "Location", required: true },
  to: { type: Schema.Types.ObjectId, ref: "Location", required: true },
  time: { type: Date, required: true }, // 출발 시간
  part: {
    type: [participantSchema],
    validate: [
      function (this: Room, value: Types.DocumentArray<Participant>) {
        return value.length <= this.maxPartLength;
      },
    ],
  }, // 참여 멤버 및 정산 여부
  madeat: { type: Date, required: true }, // 생성 날짜
  settlementTotal: { type: Number, default: 0, required: true },
  maxPartLength: { type: Number, require: true, default: 4 },
});

export const roomModel = model("Room", roomSchema);

const locationSchema = new Schema<Location>({
  enName: { type: String, required: true },
  koName: { type: String, required: true },
  priority: { type: Number, default: 0 },
  isValid: { type: Boolean, default: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
});

export const locationModel = model("Location", locationSchema);

const chatSchema = new Schema<Chat>({
  roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
  type: {
    type: String,
    enum: [
      "text",
      "in",
      "out",
      "s3img",
      "payment",
      "settlement",
      "account",
      "departure", // 출발 15분 전 알림
      "arrival", // 출발 (1|24)시간 이후 알림 - 정산/송금 권유
    ],
  }, // 메시지 종류
  authorId: { type: Schema.Types.ObjectId, ref: "User" }, // 작성자 id
  content: { type: String, default: "" },
  time: { type: Date, required: true },
  isValid: { type: Boolean, default: true },
});
chatSchema.index({ roomId: 1, time: -1 });

export const chatModel = model("Chat", chatSchema);

const reportSchema = new Schema<Report>({
  creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // 신고한 사람 id
  reportedId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // 신고받은 사람 id
  type: {
    type: String,
    enum: ["no-settlement", "no-show", "etc-reason"],
    required: true,
  },
  etcDetail: { type: String, default: "" }, // 기타 세부 사유
  time: { type: Date, required: true },
  roomId: { type: Schema.Types.ObjectId, ref: "Room" }, // 신고한 방 id
});

export const reportModel = model("Report", reportSchema);

const adminIPWhitelistSchema = new Schema<AdminIPWhitelist>({
  ip: { type: String, required: true }, // IP 주소
  description: { type: String, default: "" }, // 설명
});

export const adminIPWhitelistModel = model(
  "AdminIPWhitelist",
  adminIPWhitelistSchema
);

const adminLogSchema = new Schema<AdminLog>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Log 취급자 User
  time: { type: Date, required: true }, // Log 발생 시각
  ip: { type: String, required: true }, // 접속 IP 주소
  target: { type: String, default: "" }, // 처리한 정보주체 정보
  action: {
    type: String,
    enum: ["create", "read", "update", "delete"],
    required: true,
  }, // 수행 업무
});

export const adminLogModel = model("AdminLog", adminLogSchema);

mongoose.set("strictQuery", true);

const database = mongoose.connection;
database.on("error", console.error.bind(console, "mongoose connection error."));
database.on("open", () => {
  logger.info("Connected to database");
});
database.on("error", function (err) {
  logger.error("Database connection error occurred: " + err);
  mongoose.disconnect();
});

export const connectDatabase = (mongoUrl: string) => {
  database.on("disconnected", function () {
    // 데이터베이스 연결이 끊어지면 5초 후 재연결을 시도합니다.
    logger.error("Disconnected from database!");
    setTimeout(() => {
      mongoose.connect(
        mongoUrl /*{
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }*/
      ); // NOTE: https://velog.io/@untiring_dev/MongoDB-MongoDB-Mongoose%EC%97%90-%EC%97%B0%EA%B2%B0
    }, 5000);
  });

  mongoose.connect(
    mongoUrl /*{
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }*/
  );

  return database;
};

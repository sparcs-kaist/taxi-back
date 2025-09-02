import mongoose, { model, Schema, Types } from "mongoose";
import logger from "@/modules/logger";

type InferSchemaType<T> = mongoose.InferSchemaType<T> & { _id: Types.ObjectId };

const userSchema = new Schema({
  name: { type: String, required: true }, //실명
  nickname: { type: String, required: true }, //닉네임
  id: { type: String, required: true }, //택시 서비스에서만 사용되는 id
  profileImageUrl: { type: String, required: true }, //백엔드에서의 프로필 이미지 경로
  ongoingRoom: [{ type: Schema.Types.ObjectId, ref: "Room" }], // 참여중인 진행중인 방 배열
  doneRoom: [{ type: Schema.Types.ObjectId, ref: "Room" }], // 참여중인 완료된 방 배열
  withdraw: { type: Boolean, default: false }, //탈퇴 여부
  withdrewAt: { type: Date }, //탈퇴 시각
  phoneNumber: { type: String }, // 전화번호 (2023FALL 이벤트부터 추가)
  badge: { type: Boolean }, // 인증 뱃지 사용 여부
  residence: { type: String }, // 선호하는 위치 정보
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
export type User = InferSchemaType<typeof userSchema>;

const banSchema = new Schema({
  // 정지 시킬 사용자를 기제함.
  userSid: { type: String, required: true },
  // 정지 사유
  reason: { type: String, required: true },
  bannedAt: { type: Date, required: true }, // 정지 당한 시각
  expireAt: { type: Date, required: true }, // 정지 만료 시각
  // 정지를 당한 서비스를 기제함
  serviceName: {
    type: String,
    required: true,
    // 필요시 이곳에 정지를 시킬 서비스를 추가함.
    enum: [
      "service", // service: 방 생성/참여 제한
      "2023-fall-event", // xxxx-xxxx-event: 특정 이벤트 참여 제한
    ],
  },
});

export const banModel = model("Ban", banSchema);
export type Ban = InferSchemaType<typeof banSchema>;

const deviceTokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  deviceTokens: [{ type: String, required: true }],
});

export const deviceTokenModel = model("DeviceToken", deviceTokenSchema);
export type DeviceToken = InferSchemaType<typeof deviceTokenSchema>;

// 각 디바이스의 알림 설정
const notificationOptionSchema = new Schema({
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
export type NotificationOption = InferSchemaType<
  typeof notificationOptionSchema
>;

const topicSubscriptionSchema = new Schema({
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
export type TopicSubscription = InferSchemaType<typeof topicSubscriptionSchema>;

const participantSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  settlementStatus: {
    type: String,
    required: true,
    enum: ["not-departed", "paid", "send-required", "sent"],
    default: "not-departed",
  },
  readAt: { type: Date },
});

export type Participant = InferSchemaType<typeof participantSchema>;

const roomSchema = new Schema({
  name: { type: String, required: true, default: "이름 없음", text: true },
  from: { type: Schema.Types.ObjectId, ref: "Location", required: true },
  to: { type: Schema.Types.ObjectId, ref: "Location", required: true },
  time: { type: Date, required: true }, // 출발 시간
  part: {
    type: [participantSchema],
    validate: [
      function (this: Room, value: Participant[]) {
        return value.length <= this.maxPartLength;
      },
    ],
  }, // 참여 멤버 및 정산 여부
  madeat: { type: Date, required: true }, // 생성 날짜
  settlementTotal: { type: Number, default: 0, required: true },
  maxPartLength: { type: Number, required: true, default: 4 },
});

export const roomModel = model("Room", roomSchema);
export type Room = InferSchemaType<typeof roomSchema>;

const locationSchema = new Schema({
  enName: { type: String, required: true },
  koName: { type: String, required: true },
  priority: { type: Number, default: 0 },
  isValid: { type: Boolean, default: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
});

export const locationModel = model("Location", locationSchema);
export type Location = InferSchemaType<typeof locationSchema>;

const chatSchema = new Schema({
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
export type Chat = InferSchemaType<typeof chatSchema>;

const reportSchema = new Schema({
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
export type Report = InferSchemaType<typeof reportSchema>;

const emailSchema = new Schema({
  emailAddress: { type: String, required: true }, // 전송된 이메일 주소
  reportId: { type: Schema.Types.ObjectId, required: true, ref: "Report" },
  trackingId: { type: String, required: true, unique: true }, // 이메일 id
  sentAt: { type: Date, required: true }, // 이메일 전송 시간
  isOpened: { type: Boolean, required: true }, // 이메일 수신 여부
  openedAt: { type: Date }, // 이메일 수신 시간
});

export const emailModel = model("Email", emailSchema);
export type Email = InferSchemaType<typeof emailSchema>;

const adminIPWhitelistSchema = new Schema({
  ip: { type: String, required: true }, // IP 주소
  description: { type: String, default: "" }, // 설명
});

export const adminIPWhitelistModel = model(
  "AdminIPWhitelist",
  adminIPWhitelistSchema
);
export type AdminIPWhitelist = InferSchemaType<typeof adminIPWhitelistSchema>;

const adminLogSchema = new Schema({
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
export type AdminLog = InferSchemaType<typeof adminLogSchema>;

const taxiFareSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: "Location", required: true }, // 출발지
    to: { type: Schema.Types.ObjectId, ref: "Location", required: true }, // 도착지
    isMajor: { type: Boolean, default: false }, // 카이스트 본원 <-> 대전역 경로 여부
    time: { type: Number, required: true }, // 출발 시간 (24h를 30분 단위로 분리 & 요일 정보도 하나로 관리, 0 ~ 6 (Sunday~Saturday) * 48 + 0 ~ 47 (0:00 ~ 23:30))
    fare: { type: Number, default: 0 }, // 예상 택시 요금
  },
  {
    timestamps: true, // 최근 업데이트 시간 기록용
  }
);

export const taxiFareModel = model("TaxiFare", taxiFareSchema);
export type TaxiFare = InferSchemaType<typeof taxiFareSchema>;

const noticeSchema = new Schema(
  {
    title: { type: String, required: true },
    notion_url: { type: String, required: true },
    is_pinned: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: true, // 최근 업데이트 시간 기록용
  }
);

export const noticeModel = model("Notice", noticeSchema);
export type Notice = InferSchemaType<typeof noticeSchema>;

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
  database.on("disconnected", () => {
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

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// 이벤트마다 사용된 모델을 구분하기 위해 이름에 Prefix를 붙입니다.
const { eventConfig } = require("@/loadenv");
const modelNamePrefix = eventConfig?.mode ?? "";

const integerValidator = {
  validator: Number.isInteger,
  message: "{VALUE} is not an integer value",
};

const completedQuestSchema = Schema({
  questId: {
    type: String,
    required: true,
  },
  completedAt: {
    type: Date,
    required: true,
  },
});

const eventStatusSchema = Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  completedQuests: {
    type: [completedQuestSchema],
    default: [],
  },
  creditAmount: {
    type: Number,
    default: 0,
    min: 0,
    validate: integerValidator,
  },
  ticket1Amount: {
    type: Number,
    default: 0,
    min: 0,
    validate: integerValidator,
  },
  ticket2Amount: {
    type: Number,
    default: 0,
    min: 0,
    validate: integerValidator,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  inviter: {
    type: Schema.Types.ObjectId,
    ref: "User",
  }, // 이 사용자를 초대한 사용자
  isInviteUrlEnabled: {
    type: Boolean,
    default: false,
  }, // 초대 링크 활성화 여부
});

const questSchema = Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  isDisabled: {
    type: Boolean,
    required: true,
  },
});

const itemSchema = Schema({
  name: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  instagramStoryStickerImageUrl: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    validate: integerValidator,
  },
  description: {
    type: String,
    required: true,
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    validate: integerValidator,
  }, // 의미 없는 값, 기존 코드와의 호환성을 위해 남겨둡니다.
  realStock: {
    type: Number,
    required: true,
    min: 1,
    validate: integerValidator,
  }, // 상품의 실제 재고
  itemType: {
    type: Number,
    enum: [0, 1, 2, 3, 4], // 0: 일반 상품, 1: 일반 응모권, 2: 고급 응모권, 3: 랜덤 박스, 4: 쿠폰
    required: true,
  },
  isRandomItem: {
    type: Boolean,
    required: true,
  },
  randomWeight: {
    type: Number,
    required: true,
    min: 0,
    validate: integerValidator,
  },
  couponCode: {
    type: String,
    unique: true,
  },
  couponReward: {
    type: Number,
    min: 0,
    validate: integerValidator,
  },
});

const transactionSchema = Schema({
  type: {
    type: String,
    enum: ["get", "use"],
    required: true,
  }, // get: 재화 획득, use: 재화 사용
  amount: {
    type: Number,
    required: true,
    min: 0,
    validate: integerValidator,
  }, // 재화의 변화량의 절댓값
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  questId: {
    type: String,
  }, // 완료한 퀘스트의 ID
  itemId: {
    type: Schema.Types.ObjectId,
    ref: `${modelNamePrefix}Item`,
  }, // 획득한 상품의 ID
  itemAmount: {
    type: Number,
    min: 1,
    validate: integerValidator,
  }, // 획득한 상품의 개수
  comment: {
    type: String,
    required: true,
  },
});
transactionSchema.set("timestamps", {
  createdAt: "createdAt",
  updatedAt: false,
});

// 이벤트 코드입니다.
transactionSchema.index(
  { userId: 1, type: 1, amount: 1, comment: 1 },
  { unique: true, partialFilterExpression: { type: "get" } }
);
transactionSchema.index({ userId: 1, createdAt: -1 });

const quizSchema = Schema({
  quizDate: { type: Date, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String, required: true },
  // A와 B는 최종 답안, C와 D는 인원 수에 따라 dailyQuiz.ts 에서 A와 B로 결정됩니다.
  answer: { type: String, enum: ["A", "B", "C", "D"], default: "C" },
  countA: { type: Number, default: 0 },
  countB: { type: Number, default: 0 },
  answers: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      answer: { type: String, enum: ["A", "B"] },
      submittedAt: { type: Date, required: true },
      status: {
        type: String,
        enum: ["correct", "wrong", "unknown", "draw"],
        default: "unknown",
      },
    },
  ],
});

module.exports = {
  eventStatusModel: mongoose.model(
    `${modelNamePrefix}EventStatus`,
    eventStatusSchema
  ),
  questModel: mongoose.model(`${modelNamePrefix}Quest`, questSchema),
  itemModel: mongoose.model(`${modelNamePrefix}Item`, itemSchema),
  transactionModel: mongoose.model(
    `${modelNamePrefix}Transaction`,
    transactionSchema
  ),
  quizModel: mongoose.model(`${modelNamePrefix}Quiz`, quizSchema),
};

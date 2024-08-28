const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// 이벤트마다 사용된 모델을 구분하기 위해 이름에 Prefix를 붙입니다.
const { eventConfig } = require("../../../../loadenv");
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
  isInvitationUrlEnabled: {
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
  },
  itemType: {
    type: Number,
    enum: [0, 1, 2, 3],
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
});

const transactionSchema = Schema({
  type: {
    type: String,
    enum: ["get", "use"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    validate: integerValidator,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  questId: {
    type: String,
  },
  item: {
    type: Schema.Types.ObjectId,
    ref: `${modelNamePrefix}Item`,
  },
  itemType: {
    type: Number,
    enum: [0, 1, 2, 3],
  },
  comment: {
    type: String,
    required: true,
  },
});
transactionSchema.set("timestamps", {
  createdAt: "createdAt",
  updatedAt: false,
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
};

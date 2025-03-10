import mongoose, { Schema, Document, Model } from "mongoose";
import { eventConfig } from "@/loadenv";

// 이벤트마다 사용된 모델을 구분하기 위해 Prefix 설정
const modelNamePrefix = eventConfig?.mode ?? "";

// 정수 유효성 검사
const integerValidator = {
  validator: Number.isInteger,
  message: "{VALUE} is not an integer value",
};

// 인터페이스 정의
// Document 안에 쓰이는 객체는 그래도 쓰고
// Document로 받아오는 객체는 Document 확장함.

interface ICompletedQuest {
  questId: string;
  completedAt: Date;
}

interface IEventStatus extends Document {
  userId: mongoose.Types.ObjectId;
  completedQuests: ICompletedQuest[];
  creditAmount: number;
  ticket1Amount: number;
  ticket2Amount: number;
  isBanned: boolean;
  inviter?: mongoose.Types.ObjectId;
  isInviteUrlEnabled: boolean;
}

interface IQuest extends Document {
  id: string;
  isDisabled: boolean;
}

interface IItem extends Document {
  name: string;
  imageUrl: string;
  instagramStoryStickerImageUrl?: string;
  price: number;
  description: string;
  isDisabled: boolean;
  stock: number;
  realStock: number;
  itemType: 0 | 1 | 2 | 3 | 4;
  isRandomItem: boolean;
  randomWeight: number;
  couponCode?: string;
  couponReward?: number;
}

interface ITransaction extends Document {
  type: "get" | "use";
  amount: number;
  userId: mongoose.Types.ObjectId;
  questId?: string;
  itemId?: mongoose.Types.ObjectId;
  itemAmount?: number;
  comment: string;
  createdAt: Date;
}

interface IQuizAnswer {
  userId: mongoose.Types.ObjectId;
  answer: "A" | "B";
  submittedAt: Date;
  status: "correct" | "wrong" | "unknown" | "draw";
}

interface IQuiz extends Document {
  quizDate: Date;
  title: string;
  content: string;
  image: string;
  answer: "A" | "B" | "C" | "D";
  countA: number;
  countB: number;
  answers: IQuizAnswer[];
}

// 스키마 정의
const completedQuestSchema = new Schema<ICompletedQuest>({
  questId: { type: String, required: true },
  completedAt: { type: Date, required: true },
});

const eventStatusSchema = new Schema<IEventStatus>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  completedQuests: { type: [completedQuestSchema], default: [] },
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
  isBanned: { type: Boolean, default: false },
  inviter: { type: Schema.Types.ObjectId, ref: "User" },
  isInviteUrlEnabled: { type: Boolean, default: false },
});

const questSchema = new Schema<IQuest>({
  id: { type: String, required: true, unique: true },
  isDisabled: { type: Boolean, required: true },
});

const itemSchema = new Schema<IItem>({
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  instagramStoryStickerImageUrl: { type: String },
  price: { type: Number, required: true, min: 0, validate: integerValidator },
  description: { type: String, required: true },
  isDisabled: { type: Boolean, default: false },
  stock: { type: Number, required: true, min: 0, validate: integerValidator },
  realStock: {
    type: Number,
    required: true,
    min: 1,
    validate: integerValidator,
  },
  itemType: { type: Number, enum: [0, 1, 2, 3, 4], required: true },
  isRandomItem: { type: Boolean, required: true },
  randomWeight: {
    type: Number,
    required: true,
    min: 0,
    validate: integerValidator,
  },
  couponCode: { type: String, unique: true },
  couponReward: { type: Number, min: 0, validate: integerValidator },
});

const transactionSchema = new Schema<ITransaction>(
  {
    type: { type: String, enum: ["get", "use"], required: true },
    amount: {
      type: Number,
      required: true,
      min: 0,
      validate: integerValidator,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    questId: { type: String },
    itemId: { type: Schema.Types.ObjectId, ref: `${modelNamePrefix}Item` },
    itemAmount: { type: Number, min: 1, validate: integerValidator },
    comment: { type: String, required: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

const quizSchema = new Schema<IQuiz>({
  quizDate: { type: Date, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String, required: true },
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

// 모델생성
const eventStatusModel: Model<IEventStatus> = mongoose.model(
  `${modelNamePrefix}EventStatus`,
  eventStatusSchema
);
const questModel: Model<IQuest> = mongoose.model(
  `${modelNamePrefix}Quest`,
  questSchema
);
const itemModel: Model<IItem> = mongoose.model(
  `${modelNamePrefix}Item`,
  itemSchema
);
const transactionModel: Model<ITransaction> = mongoose.model(
  `${modelNamePrefix}Transaction`,
  transactionSchema
);
const quizModel: Model<IQuiz> = mongoose.model(
  `${modelNamePrefix}Quiz`,
  quizSchema
);

export { eventStatusModel, questModel, itemModel, transactionModel, quizModel };

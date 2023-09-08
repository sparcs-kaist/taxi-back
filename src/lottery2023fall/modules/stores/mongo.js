const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const eventStatusSchema = Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  eventList: {
    type: [Schema.Types.ObjectId],
    default: [],
    ref: "Event",
  },
  creditAmount: {
    type: Number,
    default: 0,
  },
});

const eventSchema = Schema({
  name: {
    type: String,
    required: true,
  },
  rewardAmount: {
    type: Number,
    required: true,
  },
  maxCount: {
    type: Number,
    default: 1,
  },
  expireat: {
    type: Date,
    required: true,
  },
  isDisabled: {
    type: Boolean,
    default: false,
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
  price: {
    type: Number,
    required: true,
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
  },
  eventId: {
    type: Schema.Types.ObjectId,
    ref: "Event",
    required: true, // null이 될 수도 있지만 대부분의 경우 null이 아닐 것이기에, 안전성을 위해 true로 설정합니다.
  },
  itemId: {
    type: Schema.Types.ObjectId,
    ref: "Item",
    default: null,
  },
  comment: {
    type: String,
    required: true,
  },
});
transactionSchema.set("timestamps", {
  createdAt: "doneat",
  updatedAt: false,
});

module.exports = {
  eventStatusModel: mongoose.model("EventStatus", eventStatusSchema),
  eventModel: mongoose.model("Event", eventSchema),
  itemModel: mongoose.model("Item", itemSchema),
  transactionModel: mongoose.model("Transaction", transactionSchema),
};

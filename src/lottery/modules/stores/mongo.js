const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const integerValidator = {
  validator: Number.isInteger,
  message: "{VALUE} is not an integer value",
};

const eventStatusSchema = Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  eventList: {
    type: [String],
    default: [],
  },
  creditAmount: {
    type: Number,
    default: 0,
    min: 0,
    validate: integerValidator,
  },
});

const eventSchema = Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  isDisabled: {
    type: Boolean,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  description: {
    type: String,
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
  eventId: {
    type: String,
  },
  item: {
    type: Schema.Types.ObjectId,
    ref: "Item",
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
  createdAt: "doneat",
  updatedAt: false,
});

module.exports = {
  eventStatusModel: mongoose.model("EventStatus", eventStatusSchema),
  eventModel: mongoose.model("Event", eventSchema),
  itemModel: mongoose.model("Item", itemSchema),
  transactionModel: mongoose.model("Transaction", transactionSchema),
};

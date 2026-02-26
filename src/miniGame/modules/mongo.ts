import { model, Schema, Types } from "mongoose";
import { InferSchemaType } from "@/modules/stores/mongo";

const miniGameSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  level: { type: Number, required: true, default: 0 },
  bestRecord: { type: Number, required: true, default: 0 },
  usedCredit: { type: Number, required: true, default: 0 },
  preventFail: { type: Number, required: true, default: 0 },
  preventBurst: { type: Number, required: true, default: 0 },
  dodgeScore: { type: Number, required: true, default: 0 },
  updatedAt: { type: Date, required: true },
});

export const miniGameModel = model("MiniGame", miniGameSchema);
export type MiniGame = InferSchemaType<typeof miniGameSchema>;

const wordChainSchema = new Schema({
  roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
  currentWord: { type: String, required: true },
  usedWords: { type: [String], required: true },
  players: { type: [Types.ObjectId], ref: "User", required: true },
  currentPlayerIndex: { type: Number, required: true },
  finished: { type: Boolean, required: true, default: false },
  updatedAt: { type: Date, required: true },
});

export const wordChainModel = model("WordChain", wordChainSchema);
export type WordChain = InferSchemaType<typeof wordChainSchema>;

const racingEntrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    car: { type: Number, required: true },
    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "amount must be an integer",
      },
    },
  },
  { _id: false }
);

export const racingSchema = new Schema({
  roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
  status: {
    type: String,
    enum: ["waiting", "starting", "canceled", "finished"],
  },
  players: { type: [Schema.Types.ObjectId], ref: "User", required: true },
  entries: { type: [racingEntrySchema], required: true, default: [] },
  createdAt: { type: Date, required: true },
  waitDeadline: { type: Date, required: true },
});

export const racingModel = model("Racing", racingSchema);
export type Racing = InferSchemaType<typeof racingSchema>;

const dictionarySchema = new Schema({
  word: { type: String, required: true, unique: true },
});

export const dictionaryModel = model("Dictionary", dictionarySchema);
dictionaryModel.init(); // Ensure unique indexes are created
export type Dictionary = InferSchemaType<typeof dictionarySchema>;

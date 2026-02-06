import mongoose, { model, Schema, Types } from "mongoose";
import type { InferSchemaType } from "@/modules/stores/mongo";

const mileageSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  type: {
    type: String,
    enum: ["ride", "event"],
    required: true,
  },
  source: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "voided"],
    required: true,
  },
  createdAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
});

export const mileageModel = model("Mileage", mileageSchema);
export type Mileage = InferSchemaType<typeof mileageSchema>;

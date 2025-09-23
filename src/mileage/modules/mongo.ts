import mongoose, { model, Schema, Types } from "mongoose";

type InferSchemaType<T> = mongoose.InferSchemaType<T> & { _id: Types.ObjectId };

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
  createAt: { type: Date, required: true },
  expireAt: { type: Date, required: true },
});

export const mileageModel = model("Mileage", mileageSchema);
export type Mileage = InferSchemaType<typeof mileageSchema>;

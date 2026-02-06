import { userModel } from "@/modules/stores/mongo";
import { mileageModel } from "../modules/mongo";

import { Types } from "mongoose";

import logger from "@/modules/logger";

type MileageTransactionCreateObject = {
  userId: Types.ObjectId;
  time?: Date;
  type: string;
  source: Types.ObjectId | string;
  amount: number;
};

function getRandomTimeBetweenNowAndTwoYearsAgo() {
  const now = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const min = twoYearsAgo.getTime();
  const max = now.getTime();

  const randomTimestamp = min + Math.random() * (max - min);
  return new Date(randomTimestamp); // Date 객체 반환
}

function getRandomAmount() {
  const min = 100;
  const max = 10000;
  const step = 100;

  const steps = (max - min) / step + 1; // 100
  const randomStepIndex = Math.floor(Math.random() * steps); // 0 ~ 99
  return min + randomStepIndex * step; // 100, 200, ... , 10000
}

const toSourceString = (src: Types.ObjectId | string) => {
  return typeof src === "string" ? src : src.toString();
};

export const createTransaction = async (
  input: MileageTransactionCreateObject,
  status: string
) => {
  const { userId, type, source, amount } = input;
  const time = input.time ? input.time : new Date();

  let expireDate = new Date(time);
  expireDate.setUTCFullYear(expireDate.getUTCFullYear() + 1);

  try {
    let transaction = new mileageModel({
      user: userId,
      type: type,
      source: toSourceString(source),
      amount: amount,
      status,
      createdAt: time,
      expiresAt: expireDate,
    });

    await transaction.save();

    return true;
  } catch (err) {
    logger.error(err);
    return false;
  }
};

export const testFunction = async () => {
  const userMonday = await userModel.findOne({ id: "monday" });
  const transactionNum = 20;
  if (userMonday === null) {
    logger.info("there is no monday. Bye~");
  } else {
    for (let i = 0; i < transactionNum; i++) {
      createTransaction(
        {
          userId: userMonday._id,
          time: getRandomTimeBetweenNowAndTwoYearsAgo(),
          type: "event",
          source: "event",
          amount: getRandomAmount(),
        },
        "confirmed"
      );
      createTransaction(
        {
          userId: userMonday._id,
          time: getRandomTimeBetweenNowAndTwoYearsAgo(),
          type: "event",
          source: "event",
          amount: getRandomAmount(),
        },
        "pending"
      );
    }
  }
};

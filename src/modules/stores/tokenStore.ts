import { model, Schema } from "mongoose";
import pLimit from "p-limit";
import { oneApp as oneAppConfig } from "@/loadenv";
import type { OneAppTokenPayload } from "@/types/jwt";
import redisClient from "./redis";

const getTokenStore = () => {
  const limit = pLimit(1);

  // 환경변수 REDIS_PATH 유무에 따라 token 저장 방식이 변경됩니다.
  if (redisClient) {
    const expiry = oneAppConfig.refreshTokenExpiry / 1000; // redis는 초 단위로 만료 시간을 설정합니다.
    return {
      insert: async (tokenId: string, payload: OneAppTokenPayload) => {
        await redisClient!.set(`token:${tokenId}`, JSON.stringify(payload), {
          EX: expiry,
        });
      },
      update: (oldTokenId: string, newTokenId: string) =>
        limit(async () => {
          const payload = await redisClient!.get(`token:${oldTokenId}`);
          if (!payload) {
            return { oid: undefined, uid: undefined };
          }
          await Promise.all([
            redisClient!.del(`token:${oldTokenId}`),
            redisClient!.set(`token:${newTokenId}`, payload, { EX: expiry }),
          ]);
          return JSON.parse(payload) as OneAppTokenPayload;
        }),
    };
  } else {
    const tokenSchema = new Schema({
      _id: { type: String, required: true },
      expiresAt: { type: Date, required: true },
      oid: { type: String, required: true },
      uid: { type: String, required: true },
    });
    tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    const tokenModel = model("Token", tokenSchema);
    return {
      insert: async (tokenId: string, { oid, uid }: OneAppTokenPayload) => {
        const newToken = new tokenModel({
          _id: tokenId,
          expiresAt: Date.now() + oneAppConfig.refreshTokenExpiry,
          oid,
          uid,
        });
        await newToken.save();
      },
      update: (oldTokenId: string, newTokenId: string) =>
        limit(async () => {
          const payload = await tokenModel
            .findById(oldTokenId, "oid uid")
            .lean();
          if (!payload) {
            return {};
          }

          const { oid, uid } = payload;
          const newToken = new tokenModel({
            _id: newTokenId,
            expiresAt: Date.now() + oneAppConfig.refreshTokenExpiry,
            oid,
            uid,
          });

          await Promise.all([
            tokenModel.deleteOne({ _id: oldTokenId }),
            newToken.save(),
          ]);
          return { oid, uid } satisfies OneAppTokenPayload;
        }),
    };
  }
};

export default getTokenStore();

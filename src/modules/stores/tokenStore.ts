import { model, Schema } from "mongoose";
import pLimit from "p-limit";
import redisClient from "./redis";

type TokenPayload = { oid: string; uid: string };

const TOKEN_AGE = 30 * 24 * 60 * 60; // 30일

const getTokenStore = () => {
  const limit = pLimit(1);

  // 환경변수 REDIS_PATH 유무에 따라 token 저장 방식이 변경됩니다.
  if (redisClient) {
    return {
      insert: async (token: string, payload: TokenPayload) => {
        await redisClient!.set(`token:${token}`, JSON.stringify(payload), {
          EX: TOKEN_AGE,
        });
      },
      update: (oldToken: string, newToken: string) =>
        limit(
          async (oldToken: string, newToken: string) => {
            const payload = await redisClient!.get(`token:${oldToken}`);
            if (!payload) {
              return {};
            }
            await Promise.all([
              redisClient!.del(`token:${oldToken}`),
              redisClient!.set(`token:${newToken}`, payload, { EX: TOKEN_AGE }),
            ]);
            return JSON.parse(payload) as TokenPayload;
          },
          oldToken,
          newToken
        ),
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
      insert: async (token: string, { oid, uid }: TokenPayload) => {
        const expiresAt = new Date(Date.now() + TOKEN_AGE * 1000);
        await tokenModel.create({ _id: token, expiresAt, oid, uid });
      },
      update: (oldToken: string, newToken: string) =>
        limit(
          async (oldToken: string, newToken: string) => {
            const payload = await tokenModel.findById(oldToken).lean();
            if (!payload) {
              return {};
            }
            const { oid, uid } = payload;
            const expiresAt = new Date(Date.now() + TOKEN_AGE * 1000);

            await tokenModel.deleteOne({ _id: oldToken });
            await tokenModel.create({
              _id: newToken,
              expiresAt,
              oid: payload.oid,
              uid: payload.uid,
            });
            return { oid, uid } satisfies TokenPayload;
          },
          oldToken,
          newToken
        ),
    };
  }
};

export default getTokenStore();

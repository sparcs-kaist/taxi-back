import { model, Schema } from "mongoose";
import pLimit from "p-limit";
import { oneApp as oneAppConfig } from "@/loadenv";
import type { OneAppTokenPayload } from "@/types/jwt";
import { redisClient } from "./redis";

const { refreshTokenExpiry: expiry } = oneAppConfig;

class RedisTokenStore {
  #updateLimiter = pLimit(1);

  async insert(tokenId: string, payload: OneAppTokenPayload) {
    await redisClient!.set(`token:${tokenId}`, JSON.stringify(payload), {
      EX: expiry / 1000, // redis는 초 단위로 만료 시간을 설정합니다.
    });
  }

  update(oldTokenId: string, newTokenId: string) {
    return this.#updateLimiter(async () => {
      const payload = await redisClient!.get(`token:${oldTokenId}`);
      if (!payload) {
        return { oid: undefined, uid: undefined };
      }
      await Promise.all([
        redisClient!.del(`token:${oldTokenId}`),
        redisClient!.set(`token:${newTokenId}`, payload, {
          EX: expiry / 1000, // redis는 초 단위로 만료 시간을 설정합니다.
        }),
      ]);
      return JSON.parse(payload) as OneAppTokenPayload;
    });
  }
}

class MongoTokenStore {
  #model;
  #updateLimiter = pLimit(1);

  constructor() {
    const schema = new Schema({
      _id: { type: String, required: true },
      expiresAt: { type: Date, required: true },
      oid: { type: String, required: true },
      uid: { type: String, required: true },
    });
    schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    this.#model = model("Token", schema);
  }

  async insert(tokenId: string, { oid, uid }: OneAppTokenPayload) {
    const newToken = new this.#model({
      _id: tokenId,
      expiresAt: Date.now() + expiry,
      oid,
      uid,
    });
    await newToken.save();
  }

  update(oldTokenId: string, newTokenId: string) {
    return this.#updateLimiter(async () => {
      const payload = await this.#model.findById(oldTokenId, "oid uid").lean();
      if (!payload) {
        return { oid: undefined, uid: undefined };
      }

      const { oid, uid } = payload;
      const newToken = new this.#model({
        _id: newTokenId,
        expiresAt: Date.now() + expiry,
        oid,
        uid,
      });
      await Promise.all([
        this.#model.deleteOne({ _id: oldTokenId }),
        newToken.save(),
      ]);
      return { oid, uid } satisfies OneAppTokenPayload;
    });
  }
}

const getTokenStore = () => {
  // 환경변수 REDIS_PATH 유무에 따라 token 저장 방식이 변경됩니다.
  if (redisClient) {
    return new RedisTokenStore();
  } else {
    return new MongoTokenStore();
  }
};

export default getTokenStore();

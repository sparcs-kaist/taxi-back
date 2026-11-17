import { expect } from "chai";
import express from "express";
import jsonwebtoken from "jsonwebtoken";
import request from "supertest";
import type { Socket } from "socket.io";
import { jwt as jwtConfig } from "@/loadenv";
import { authMiddleware } from "@/middlewares";
import buddyTokenMiddleware, {
  buddySocketMiddleware,
} from "@/middlewares/buddyToken";
import { userGenerator, testRemover, type TestData } from "../utils";

const testData: TestData = {
  rooms: [],
  users: [],
  chat: [],
  location: [],
  report: [],
};

const buddyToken = (uid: string, expiresInSeconds = 60) =>
  jsonwebtoken.sign(
    {
      uid,
      type: "access",
      iss: "buddy",
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    },
    jwtConfig.secretKey,
    { algorithm: "HS256" }
  );

// buddyTokenMiddleware → authMiddleware → 로그인 정보를 그대로 돌려주는 테스트용 앱
const app = express();
app.use(buddyTokenMiddleware);
app.get("/whoami", authMiddleware, (req, res) =>
  res.json({ oid: req.userOid, uid: req.userUid })
);

const runSocketMiddleware = async (authorization?: string) => {
  const socket = {
    request: { headers: authorization ? { authorization } : {} },
  } as unknown as Socket;
  let error: (Error & { data?: { status: number } }) | undefined;
  await buddySocketMiddleware(socket, (err) => {
    error = err;
  });
  return { socket, error };
};

describe("[buddyToken] Buddy access token authentication", () => {
  after(async () => {
    await testRemover(testData);
  });

  describe("REST", () => {
    it("logs in a Taxi user with a uid-only Buddy token", async () => {
      const user = await userGenerator("buddy-rest-user", testData);

      const response = await request(app)
        .get("/whoami")
        .set("Authorization", `Bearer ${buddyToken("buddy-rest-user")}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({
        oid: user._id.toString(),
        uid: "buddy-rest-user",
      });
    });

    it("returns 401 for an expired Buddy token so the app refreshes", async () => {
      await userGenerator("buddy-expired-user", testData);

      const response = await request(app)
        .get("/whoami")
        .set(
          "Authorization",
          `Bearer ${buddyToken("buddy-expired-user", -1)}`
        );

      expect(response.status).to.equal(401);
      expect(response.body).to.deep.equal({ error: "token expired" });
    });

    it("returns 401 when no Taxi user matches the uid", async () => {
      const response = await request(app)
        .get("/whoami")
        .set("Authorization", `Bearer ${buddyToken("buddy-missing-user")}`);

      expect(response.status).to.equal(401);
    });

    it("leaves non-Buddy tokens to the other login methods", async () => {
      const response = await request(app)
        .get("/whoami")
        .set("Authorization", "Bearer not-a-jwt");

      expect(response.status).to.equal(403);
    });
  });

  describe("socket.io handshake", () => {
    it("attaches login info for a valid Buddy token", async () => {
      const user = await userGenerator("buddy-socket-user", testData);

      const { socket, error } = await runSocketMiddleware(
        `Bearer ${buddyToken("buddy-socket-user")}`
      );

      expect(error).to.equal(undefined);
      expect((socket.request as express.Request).buddyLoginInfo).to.deep.equal(
        { id: "buddy-socket-user", oid: user._id.toString() }
      );
    });

    it("rejects an expired Buddy token with status 401", async () => {
      await userGenerator("buddy-socket-expired", testData);

      const { error } = await runSocketMiddleware(
        `Bearer ${buddyToken("buddy-socket-expired", -1)}`
      );

      expect(error?.message).to.equal("token expired");
      expect(error?.data).to.deep.equal({ status: 401 });
    });

    it("passes through when there is no bearer token", async () => {
      const { socket, error } = await runSocketMiddleware();

      expect(error).to.equal(undefined);
      expect((socket.request as express.Request).buddyLoginInfo).to.equal(
        undefined
      );
    });
  });
});

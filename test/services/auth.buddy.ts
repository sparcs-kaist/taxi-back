import { expect } from "chai";
import express from "express";
import jsonwebtoken from "jsonwebtoken";
import request from "supertest";
import { oneApp as oneAppConfig } from "@/loadenv";
import buddyTokenMiddleware from "@/middlewares/buddyToken";
import authRouter from "@/routes/auth";
import { userModel } from "@/modules/stores/mongo";
import { userGenerator, testRemover, type TestData } from "../utils";

const testData: TestData = {
  rooms: [],
  users: [],
  chat: [],
  location: [],
  report: [],
};

const now = () => Math.floor(Date.now() / 1000);

const sign = (payload: object) =>
  jsonwebtoken.sign({ iss: "buddy", ...payload }, oneAppConfig.secretKey, {
    algorithm: "HS256",
  });

const accessToken = (uid: string, expiresInSeconds = 60) =>
  sign({ uid, type: "access", exp: now() + expiresInSeconds });

const profile = (uid: string) => ({
  uid,
  email: `${uid}@sparcs.org`,
  first_name: "길동",
  last_name: "홍",
  gender: "*H",
  birthday: "2000-01-01",
  flags: [],
  facebook_id: null,
  twitter_id: null,
  kaist_id: null,
  kaist_info: null,
  kaist_info_time: "",
  kaist_v2_info: JSON.stringify({
    std_no: "20240001",
    socps_cd: "S",
    email: `${uid}@kaist.ac.kr`,
  }),
  kaist_v2_info_time: "",
  sparcs_id: null,
});

// Buddy 백엔드의 sign_sso_info와 같은 형태: sid 없이 type: "sso_info", 5분 수명
const ssoInfo = (
  uid: string,
  overrides: object = {},
  expiresInSeconds = 300
) =>
  sign({
    ...profile(uid),
    type: "sso_info",
    exp: now() + expiresInSeconds,
    ...overrides,
  });

// 실제 서버처럼 buddyTokenMiddleware를 거친 뒤 /auth 라우터로 들어가는 테스트용 앱
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.timestamp = Date.now();
  next();
});
app.use(buddyTokenMiddleware);
app.use("/auth", authRouter);

const bootstrap = (token: string | undefined, body: object) => {
  const req = request(app).post("/auth/buddy/bootstrap").send(body);
  return token ? req.set("Authorization", `Bearer ${token}`) : req;
};

const trackCreatedUser = async (uid: string) => {
  const user = await userModel.findOne({ id: uid, withdraw: false });
  if (user) testData.users.push(user);
  return user;
};

describe("[auth.buddy] POST /auth/buddy/bootstrap", () => {
  after(async () => {
    await testRemover(testData);
  });

  it("creates a Taxi user for a new Buddy user", async () => {
    const uid = "buddy-bootstrap-new";

    const response = await bootstrap(accessToken(uid), {
      ssoInfo: ssoInfo(uid),
    });

    expect(response.status).to.equal(201);
    const user = await trackCreatedUser(uid);
    expect(user?.name).to.equal("홍길동");
    expect(user?.email).to.equal(`${uid}@kaist.ac.kr`);
    expect(user?.subinfo?.kaist).to.equal("20240001");
  });

  it("returns 200 for an existing user and updates changed details", async () => {
    const uid = "buddy-bootstrap-existing";
    await userGenerator(uid, testData);

    const response = await bootstrap(accessToken(uid), {
      ssoInfo: ssoInfo(uid),
    });

    expect(response.status).to.equal(200);
    const user = await userModel.findOne({ id: uid, withdraw: false });
    expect(user?.name).to.equal("홍길동");
    expect(user?.subinfo?.kaist).to.equal("20240001");
    expect(await userModel.countDocuments({ id: uid })).to.equal(1);
  });

  it("returns 401 for an expired access token so the app refreshes", async () => {
    const uid = "buddy-bootstrap-expired-access";

    const response = await bootstrap(accessToken(uid, -1), {
      ssoInfo: ssoInfo(uid),
    });

    expect(response.status).to.equal(401);
    expect(response.body).to.deep.equal({ error: "token expired" });
    expect(await trackCreatedUser(uid)).to.equal(null);
  });

  it("returns 401 without a Buddy access token", async () => {
    const response = await bootstrap(undefined, {
      ssoInfo: ssoInfo("buddy-bootstrap-no-access"),
    });

    expect(response.status).to.equal(401);
  });

  it("rejects ssoInfo for a different uid", async () => {
    const response = await bootstrap(accessToken("buddy-bootstrap-a"), {
      ssoInfo: ssoInfo("buddy-bootstrap-b"),
    });

    expect(response.status).to.equal(400);
    expect(await trackCreatedUser("buddy-bootstrap-a")).to.equal(null);
    expect(await trackCreatedUser("buddy-bootstrap-b")).to.equal(null);
  });

  it("rejects an expired ssoInfo", async () => {
    const uid = "buddy-bootstrap-expired-sso";

    const response = await bootstrap(accessToken(uid), {
      ssoInfo: ssoInfo(uid, {}, -1),
    });

    expect(response.status).to.equal(400);
    expect(await trackCreatedUser(uid)).to.equal(null);
  });

  it("rejects an access token passed as ssoInfo", async () => {
    const uid = "buddy-bootstrap-wrong-type";

    const response = await bootstrap(accessToken(uid), {
      ssoInfo: accessToken(uid),
    });

    expect(response.status).to.equal(400);
    expect(await trackCreatedUser(uid)).to.equal(null);
  });

  it("rejects ssoInfo signed with another key", async () => {
    const uid = "buddy-bootstrap-forged";
    const forged = jsonwebtoken.sign(
      { ...profile(uid), type: "sso_info", iss: "buddy", exp: now() + 300 },
      "not-the-shared-secret",
      { algorithm: "HS256" }
    );

    const response = await bootstrap(accessToken(uid), { ssoInfo: forged });

    expect(response.status).to.equal(400);
    expect(await trackCreatedUser(uid)).to.equal(null);
  });
});

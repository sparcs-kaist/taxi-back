const { expect } = require("chai");
const jsonwebtoken = require("jsonwebtoken");
const { sign, verify, verifyBuddyToken } = require("../../../src/modules/auths/jwt");
const {
  jwt: jwtConfig,
  oneApp: oneAppConfig,
} = require("../../../src/loadenv");

// jwt.js 관련 2개의 함수를 테스트
// 1. jwt 서명과 검증이 성공적으로 되는지 테스트
describe("[jwt] 1.sign & verify", () => {
  it("should sign and verify jwt correctly", async () => {
    // JWT 서명에 사용되는 사용자
    const user = {
      _id: "507f191e810c19729de860ea",
    };

    // 토큰 생성이 성공적으로 되는지 테스트
    const { token: accessToken } = sign({
      id: user._id,
      type: "access",
    });
    const { token: refreshToken } = sign({
      id: user._id,
      type: "refresh",
    });

    // 토큰 검증이 성공적으로 되는지 테스트
    const accessTokenStatus = verify(accessToken);
    expect(accessTokenStatus).to.has.property("id", user._id);
    const refreshTokenStatus = verify(refreshToken);
    expect(refreshTokenStatus).to.has.property("id", user._id);
  });

  it("should verify Buddy tokens and return the signed uid", async () => {
    const token = jsonwebtoken.sign(
      {
        uid: "buddy-user",
        type: "access",
        iss: "buddy",
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      oneAppConfig.secretKey,
      { algorithm: "HS256" }
    );

    const payload = verifyBuddyToken(token);
    expect(payload).to.have.property("uid", "buddy-user");
    expect(payload).to.have.property("type", "access");
    expect(payload).to.have.property("iss", "buddy");
    expect(payload.exp).to.be.greaterThan(Math.floor(Date.now() / 1000));
  });

  it("should reject Buddy tokens without the required claims", async () => {
    const token = jsonwebtoken.sign(
      { uid: "buddy-user", type: "access", iss: "buddy" },
      oneAppConfig.secretKey,
      { algorithm: "HS256" }
    );

    expect(verifyBuddyToken(token)).to.equal(undefined);
  });

  it("should reject Buddy tokens signed with another secret", async () => {
    const token = jsonwebtoken.sign(
      {
        uid: "buddy-user",
        type: "access",
        iss: "buddy",
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      "different-secret",
      { algorithm: "HS256" }
    );

    expect(verifyBuddyToken(token)).to.equal(undefined);
  });

  it("should reject Buddy tokens signed with the Taxi JWT secret", async () => {
    const token = jsonwebtoken.sign(
      {
        uid: "buddy-user",
        type: "access",
        iss: "buddy",
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      jwtConfig.secretKey,
      { algorithm: "HS256" }
    );

    expect(verifyBuddyToken(token)).to.equal(undefined);
  });

  it("should report expired Buddy tokens as TOKEN_EXPIRED", async () => {
    const token = jsonwebtoken.sign(
      {
        uid: "buddy-user",
        type: "access",
        iss: "buddy",
        exp: Math.floor(Date.now() / 1000) - 1,
      },
      oneAppConfig.secretKey,
      { algorithm: "HS256" }
    );

    expect(verifyBuddyToken(token)).to.equal(jwtConfig.TOKEN_EXPIRED);
  });

  it("should not report expired tokens from other issuers as Buddy tokens", async () => {
    const token = jsonwebtoken.sign(
      {
        uid: "buddy-user",
        type: "access",
        iss: "other-service",
        exp: Math.floor(Date.now() / 1000) - 1,
      },
      oneAppConfig.secretKey,
      { algorithm: "HS256" }
    );

    expect(verifyBuddyToken(token)).to.equal(undefined);
  });

  it("should not report expired Buddy tokens signed with another secret", async () => {
    const token = jsonwebtoken.sign(
      {
        uid: "buddy-user",
        type: "access",
        iss: "buddy",
        exp: Math.floor(Date.now() / 1000) - 1,
      },
      "different-secret",
      { algorithm: "HS256" }
    );

    expect(verifyBuddyToken(token)).to.equal(undefined);
  });

  it("should reject Buddy tokens that carry an oid", async () => {
    const token = jsonwebtoken.sign(
      {
        uid: "buddy-user",
        oid: "507f1f77bcf86cd799439011",
        type: "access",
        iss: "buddy",
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      oneAppConfig.secretKey,
      { algorithm: "HS256" }
    );

    expect(verifyBuddyToken(token)).to.equal(undefined);
  });

  it("should reject Buddy tokens with a different issuer", async () => {
    const token = jsonwebtoken.sign(
      {
        uid: "buddy-user",
        type: "access",
        iss: "other-service",
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      oneAppConfig.secretKey,
      { algorithm: "HS256" }
    );

    expect(verifyBuddyToken(token)).to.equal(undefined);
  });
});

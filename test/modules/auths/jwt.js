const { expect } = require("chai");
const { sign, verify } = require("../../../src/modules/auths/jwt");

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
});

const request = require("supertest");

const authHandlers = require("../../src/services/auth.replace");
const { userModel } = require("../../src/modules/stores/mongo");

// auth.replace.js 관련 1개의 handler을 테스트
// 1. dev 환경에서 로그인이 성공적으로 이루어지는지 확인
describe("[auth.replace] 1.sparcsssoHandler", () => {
  const removeTestUser = async () => {
    // drop all collections
    await userModel.deleteOne({ id: "test" });
  };

  before(removeTestUser);

  it("should redirect after successful user creation", () => {
    request(authHandlers.sparcsssoHandler)
      .post("/auth/sparcssso")
      .send({
        id: "test",
      })
      .expect(302);
  });

  after(removeTestUser);
});

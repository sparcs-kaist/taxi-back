const request = require("supertest");

const authHandlers = require("../src/services/auth.replace");
const { userModel } = require("../src/modules/stores/mongo");
const { frontUrl } = require("../loadenv");

// auth.replace.js 관련 1개의 handler을 테스트
// 1. dev 환경에서 front의 URL로 잘 redirect 되는지 확인
describe("[auth.replace] 1.sparcsssoHandler", () => {
  const removeTestUser = async () => {
    // drop all collections
    await userModel.deleteOne({ id: "test" });
  };

  before(removeTestUser);

  it("should redirect to frontUrl after successful user creation", () => {
    request(authHandlers.sparcsssoHandler)
      .post("/auth/sparcssso")
      .send({
        id: "test",
      })
      .expect(302)
      .expect("Location", frontUrl);
  });

  after(removeTestUser);
});

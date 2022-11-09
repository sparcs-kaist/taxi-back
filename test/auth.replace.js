const request = require("supertest");

const authHandlers = require("../src/service/auth.replace");
const { userModel } = require("../src/db/mongo");
const security = require("../security");

describe("[auth.replace] 1.sparcsssoHandler", () => {
  const removeTestUser = async () => {
    // drop all collections
    await userModel.deleteOne({ id: "test" });
  };

  before(removeTestUser);

  it("should redirect to security.frontUrl after successful user creation", () => {
    request(authHandlers.sparcsssoHandler)
      .post("/auth/sparcssso")
      .send({
        id: "test",
      })
      .expect(302)
      .expect("Location", security.frontUrl);
  });

  after(removeTestUser);
});

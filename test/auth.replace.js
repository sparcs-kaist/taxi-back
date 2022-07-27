const request = require("supertest");
const expect = require("chai").expect;

const authHandlers = require("../src/service/auth.replace");
const { userModel } = require("../src/db/mongo");
const security = require("../security");

describe("auth.replace handler", () => {
  const cleanUpUserCollection = async () => {
    // drop all collections
    const allUsers = await userModel.find().lean();
    if (allUsers.length != 0) await userModel.collection.drop();
  };

  before(cleanUpUserCollection);

  it("should redirect to security.frontUrl after successful user creation", () => {
    request(authHandlers.sparcsssoHandler)
      .post("/auth/sparcssso")
      .send({
        id: "test",
      })
      .expect(302)
      .expect("Location", security.frontUrl);
  });

  after(cleanUpUserCollection);
});

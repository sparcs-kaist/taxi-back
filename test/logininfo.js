const expect = require("chai").expect;
const logininfoHandlers = require("../src/service/logininfo");

describe("logininfo handler", () => {
  it("should return {id: undefined} when no user is logged in", () => {
    const req = { session: {} };
    const res = {
      json: (data) => {
        expect(data).to.deep.equal({
          id: undefined,
          sid: undefined,
          name: undefined,
        });
      },
    };
    logininfoHandlers.logininfoHandler(req, res);
  });
});

const expect = require("chai").expect;
const logininfoHandlers = require("../src/service/logininfo");
const { userModel } = require("../src/db/mongo");

describe("logininfo handler", () => {
  it("should return {id: undefined, sid: undefined, name: undefined } when no user is logged in", () => {
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

  it("should return {id: 'hello-id', sid: 'hello-sid', 'name': 'hello-name'} when user is logged in", () => {
    const req = {
      session: {
        loginInfo: {
          id: "hello-id",
          sid: "hello-sid",
          name: "hello-name",
          time: Date.now(),
        },
      },
    };
    const res = {
      json: (data) => {
        expect(data).to.deep.equal({
          id: "hello-id",
          sid: "hello-sid",
          name: "hello-name",
        });
      },
    };
    logininfoHandlers.logininfoHandler(req, res);
  });

  it("should return {id: undefined, sid: undefined, name: undefined } when the session is expired", () => {
    const req = {
      session: {
        loginInfo: {
          id: "hello-id",
          sid: "hello-sid",
          name: "hello-name",
          time: new Date(Date.now() - (3600 * 1000 + 1)).getTime(), // the session should expire after 1 hour
        },
      },
    };
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

// describe("detail info handler", () => {
// });

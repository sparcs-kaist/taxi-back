const expect = require("chai").expect;
const logininfoHandlers = require("../src/service/logininfo");
const { userModel } = require("../src/db/mongo");

describe("[logininfo] 1.logininfoHandler", () => {
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
          time: new Date(Date.now() - (14 * 24 * 3600 * 1000 + 1)).getTime(), // the session should expire after 1 hour
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

describe("[logininfo] 2.detailHandler", () => {
  it("should return { id: undefined } when no user is logged in", () => {
    const req = { session: {} };
    const res = {
      json: (data) => {
        expect(data).to.deep.equal({
          id: undefined,
        });
      },
    };
    logininfoHandlers.detailHandler(req, res);
  });

  it("should return correct information as same as user's when user is logged in", async () => {
    const req = {
      session: {
        loginInfo: {
          id: "sunday",
          sid: "sunday-sid",
          name: "sunday-name",
          time: Date.now(),
        },
      },
    };

    const result = await userModel.findOne({ id: "sunday" });
    expect(result).to.not.equal(null);

    const res = {
      json: (data) => {
        expect(data).to.deep.equal({
          oid: result._id,
          id: result.id,
          nickname: result.nickname,
          withdraw: result.withdraw,
          ban: result.ban,
          joinat: result.joinat,
          name: result.name,
          agreeOnTermsOfService: result.agreeOnTermsOfService,
          subinfo: result.subinfo,
          email: result.email,
          profileImgUrl: result.profileImageUrl,
          account: "",
        });
      },
    };
    logininfoHandlers.detailHandler(req, res);
  });

  it("should return {id: undefined} when the session is expired", () => {
    const req = {
      session: {
        loginInfo: {
          id: "hello-id",
          sid: "hello-sid",
          name: "hello-name",
          time: new Date(Date.now() - (14 * 24 * 3600 * 1000 + 1)).getTime(), // the session should expire after 1 hour
        },
      },
    };
    const res = {
      json: (data) => {
        expect(data).to.deep.equal({
          id: undefined,
        });
      },
    };
    logininfoHandlers.detailHandler(req, res);
  });
});

const expect = require("chai").expect;
const logininfoHandlers = require("../src/service/logininfo");
const { userModel } = require("../src/db/mongo");
const httpMocks = require("node-mocks-http");

describe("[logininfo] 1.logininfoHandler", () => {
  it("should return {id: undefined, sid: undefined, name: undefined } when no user is logged in", () => {
    let req = httpMocks.createRequest({
      session: {},
    });
    let res = httpMocks.createResponse();
    logininfoHandlers.logininfoHandler(req, res);

    expect(res._getJSONData().id).to.be.undefined;
    expect(res._getJSONData().sid).to.be.undefined;
    expect(res._getJSONData().name).to.be.undefined;
  });

  it("should return {id: 'hello-id', sid: 'hello-sid', 'name': 'hello-name'} when user is logged in", () => {
    let req = httpMocks.createRequest({
      session: {
        loginInfo: {
          id: "hello-id",
          sid: "hello-sid",
          name: "hello-name",
          time: Date.now(),
        },
      },
    });
    let res = httpMocks.createResponse();
    logininfoHandlers.logininfoHandler(req, res);

    expect(res._getJSONData()).to.has.property("id", "hello-id");
    expect(res._getJSONData()).to.has.property("sid", "hello-sid");
    expect(res._getJSONData()).to.has.property("name", "hello-name");
  });

  it("should return {id: undefined, sid: undefined, name: undefined } when the session is expired", () => {
    let req = httpMocks.createRequest({
      session: {
        loginInfo: {
          id: "hello-id",
          sid: "hello-sid",
          name: "hello-name",
          time: new Date(Date.now() - (14 * 24 * 3600 * 1000 + 1)).getTime(), // the session should expire after 1 hour
        },
      },
    });
    let res = httpMocks.createResponse();
    logininfoHandlers.logininfoHandler(req, res);

    expect(res._getJSONData().id).to.be.undefined;
    expect(res._getJSONData().sid).to.be.undefined;
    expect(res._getJSONData().name).to.be.undefined;
  });
});

describe("[logininfo] 2.detailHandler", () => {
  it("should return { id: undefined } when no user is logged in", () => {
    let req = httpMocks.createRequest({
      session: {},
    });
    let res = httpMocks.createResponse();
    logininfoHandlers.detailHandler(req, res);

    expect(res._getJSONData().id).to.be.undefined;
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
    let req = httpMocks.createRequest({
      session: {
        loginInfo: {
          id: "hello-id",
          sid: "hello-sid",
          name: "hello-name",
          time: new Date(Date.now() - (14 * 24 * 3600 * 1000 + 1)).getTime(), // the session should expire after 1 hour
        },
      },
    });
    let res = httpMocks.createResponse();
    logininfoHandlers.detailHandler(req, res);

    expect(res._getJSONData().id).to.be.undefined;
  });
});

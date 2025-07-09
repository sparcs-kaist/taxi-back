import { expect } from "chai";
import { logininfoHandler } from "../../src/services/logininfo";
import { userModel } from "../../src/modules/stores/mongo";

// 1-1. 로그인 한 유저가 없을 시 undefined를 return 하는지 확인
// 1-2. login 정보를 잘 return 하는지 확인
// 1-3. 세션이 만료됐을 때 undefined를 잘 return 하는지 확인
describe("[logininfo] 1.logininfoHandler", () => {
  it("should return { id: undefined } when no user is logged in", () => {
    const req = { session: {} };
    const res = {
      json: (data) => {
        expect(data).to.deep.equal({
          id: undefined,
        });
      },
    };
    logininfoHandler(req, res);
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
          deviceType: "web",
          deviceToken: undefined,
          accessToken: undefined,
          refreshToken: undefined,
        });
      },
    };
    logininfoHandler(req, res);
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
    logininfoHandler(req, res);
  });
});

const expect = require("chai").expect;
const locationHandlers = require("../../src/services/locations");
const httpMocks = require("node-mocks-http");

// locations.js 관련 1개의 handler을 테스트
// 1. 모든 location 정보를 잘 가져오는지 확인
describe("[locations] 1.getAllLocationsHandler", () => {
  it("should return information of locations correctly", async () => {
    let req = httpMocks.createRequest({});
    let res = httpMocks.createResponse();
    await locationHandlers.getAllLocationsHandler(req, res);

    expect(res._getJSONData().locations).not.to.have.lengthOf(0);
  });
});

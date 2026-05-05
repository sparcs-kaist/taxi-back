import { expect } from "chai";
import { getAllLocationsHandler } from "@/services/locations";
import httpMocks from "node-mocks-http";

// locations.js 관련 1개의 handler을 테스트
// 1. 모든 location 정보를 잘 가져오는지 확인
describe("[locations] 1.getAllLocationsHandler", () => {
  it("should return information of locations correctly", async () => {
    let req = httpMocks.createRequest({});
    let res = httpMocks.createResponse();
    await getAllLocationsHandler(req, res);

    expect(res._getJSONData().locations).not.to.have.lengthOf(0);
  });
});

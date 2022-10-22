const expect = require("chai").expect;
const locationHandlers = require("../src/service/locations");

describe("locations handler", function () {
  it("should return information of locations correctly", async function () {
    const req = {};
    const res = {
      json: (data) => {
        expect(data.locations).not.to.have.lengthOf(0);
      },
    };
    await locationHandlers.getAllLocationsHandler(req, res);
  });
});

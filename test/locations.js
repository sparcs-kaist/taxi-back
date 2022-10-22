const expect = require("chai").expect;
const locationHandlers = require("../src/service/locations");

describe("locations handler", function () {
  it("should return correct the number of locations when user is logged in", async function () {
    const numOfLocations = 5;
    const req = {};
    const res = {
      json: (data) => {
        expect(data.locations).to.have.lengthOf(numOfLocations);
      },
    };
    await locationHandlers.getAllLocationsHandler(req, res);
  });
});

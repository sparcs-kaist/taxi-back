import { expect } from "chai";
import {
  buildCreationPlans,
  getLookbackRanges,
  getTargetDate,
  getTimeBucket,
  saturdayTargetRoutes,
  tuesdayTargetRoutes,
} from "@/schedules/createWeeklyTaxiRooms";

describe("[schedules] createWeeklyTaxiRooms", () => {
  it("should calculate target and lookback dates by same weekday", () => {
    const base = new Date("2026-05-05T19:00:00+09:00");
    const targetThursday = getTargetDate(base, 4);
    const ranges = getLookbackRanges(targetThursday);

    expect(targetThursday.getDay()).to.equal(4);
    expect(targetThursday.getDate()).to.equal(7);
    expect(ranges).to.have.lengthOf(4);
    expect(ranges.every(({ start }) => start.getDay() === 4)).to.equal(true);

    const saturday = new Date("2026-05-09T19:00:00+09:00");
    const targetSunday = getTargetDate(saturday, 0);
    expect(targetSunday.getDay()).to.equal(0);
    expect(targetSunday.getDate()).to.equal(10);
  });

  it("should bucket time by 30 minutes", () => {
    expect(getTimeBucket(new Date("2026-05-07T09:29:00+09:00"))).to.deep.equal({
      hour: 9,
      minute: 0,
    });
    expect(getTimeBucket(new Date("2026-05-07T09:30:00+09:00"))).to.deep.equal({
      hour: 9,
      minute: 30,
    });
  });

  it("should split target routes by creation day", () => {
    expect(tuesdayTargetRoutes).to.deep.equal([
      { weekday: 4, from: "main", to: "station" },
      { weekday: 5, from: "main", to: "station" },
    ]);
    expect(saturdayTargetRoutes).to.deep.equal([
      { weekday: 0, from: "station", to: "main" },
    ]);
  });

  it("should create two rooms for first place and one for second place", () => {
    expect(
      buildCreationPlans([
        { hour: 9, minute: 0, participantCount: 5, roomCount: 2 },
        { hour: 10, minute: 30, participantCount: 3, roomCount: 1 },
      ])
    ).to.deep.equal([
      { hour: 9, minute: 0, count: 2 },
      { hour: 10, minute: 30, count: 1 },
    ]);
  });

  it("should create two rooms for every tied first-place bucket", () => {
    expect(
      buildCreationPlans([
        { hour: 9, minute: 0, participantCount: 5, roomCount: 2 },
        { hour: 10, minute: 30, participantCount: 5, roomCount: 1 },
        { hour: 11, minute: 0, participantCount: 3, roomCount: 1 },
      ])
    ).to.deep.equal([
      { hour: 9, minute: 0, count: 2 },
      { hour: 10, minute: 30, count: 2 },
    ]);
  });
});

import { expect } from "chai";
import {
  getTotalUnreadCount,
  getUnreadCounts,
} from "@/modules/buddyNotification";
import { chatModel, userModel } from "@/modules/stores/mongo";
import {
  userGenerator,
  roomGenerator,
  testRemover,
  type TestData,
} from "../utils";

const testData: TestData = {
  rooms: [],
  users: [],
  chat: [],
  location: [],
  report: [],
};

describe("[buddyNotification] unread counts", () => {
  after(async () => {
    await testRemover(testData);
  });

  it("counts other people's valid, non-minigame chats after readAt", async () => {
    const reader = await userGenerator("buddy-unread-reader", testData);
    const writer = await userGenerator("buddy-unread-writer", testData);
    const room = await roomGenerator("buddy-unread", testData);
    const readAt = new Date(Date.now() - 60 * 1000);
    room.part.push({ user: reader._id, readAt });
    room.part.push({ user: writer._id });
    await room.save();
    await userModel.updateOne(
      { _id: reader._id },
      { $push: { ongoingRoom: room._id } }
    );

    const at = (offsetMs: number) => new Date(readAt.getTime() + offsetMs);
    const chats = await chatModel.insertMany([
      // counted
      {
        roomId: room._id,
        type: "text",
        authorId: writer._id,
        content: "a",
        time: at(1000),
      },
      { roomId: room._id, type: "departure", content: "15", time: at(2000) },
      // not counted: before readAt, own, invalid, minigame
      {
        roomId: room._id,
        type: "text",
        authorId: writer._id,
        content: "b",
        time: at(-1000),
      },
      {
        roomId: room._id,
        type: "text",
        authorId: reader._id,
        content: "c",
        time: at(3000),
      },
      {
        roomId: room._id,
        type: "s3img",
        authorId: writer._id,
        content: "d",
        time: at(4000),
        isValid: false,
      },
      { roomId: room._id, type: "wordChain", content: "e", time: at(5000) },
    ]);
    testData.chat.push(...chats);

    const counts = await getUnreadCounts(reader._id, [room._id]);
    expect(counts).to.deep.equal({ [room._id.toString()]: 2 });
    expect(await getTotalUnreadCount(reader._id)).to.equal(2);
  });

  it("counts the same when ids are given as strings, as routes pass them", async () => {
    const [reader] = testData.users;
    const [room] = testData.rooms;

    const counts = await getUnreadCounts(reader._id.toString(), [
      room._id.toString(),
    ]);

    expect(counts).to.deep.equal({ [room._id.toString()]: 2 });
  });

  it("returns no counts for no rooms", async () => {
    expect(await getUnreadCounts("000000000000000000000000", [])).to.deep.equal(
      {}
    );
  });
});

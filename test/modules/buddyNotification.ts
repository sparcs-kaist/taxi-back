import { expect } from "chai";
import {
  buildBuddyPushRequest,
  buildBuddyPushText,
  getTotalUnreadCount,
  getUnreadCounts,
  type BuddyChatNotification,
} from "@/modules/buddyNotification";
import { chatModel, roomModel, userModel } from "@/modules/stores/mongo";
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

const chat = (
  overrides: Partial<BuddyChatNotification>
): BuddyChatNotification => ({
  roomId: "room-1",
  roomName: "To Daejeon",
  chatId: "chat-1",
  type: "text",
  content: "Hello",
  time: new Date("2026-10-28T09:00:00Z"),
  author: {
    oid: "author-oid",
    nickname: "Goose",
    profileImageUrl: "https://example.com/goose.png",
  },
  ...overrides,
});

describe("[buddyNotification] push text", () => {
  it("uses the sender as the title of a text chat", () => {
    expect(buildBuddyPushText(chat({}))).to.deep.equal({
      title: "Goose",
      body: "Hello",
    });
  });

  it("truncates long text chats", () => {
    const text = buildBuddyPushText(chat({ content: "a".repeat(500) }));
    expect(text!.body!.length).to.equal(300);
    expect(text!.body!.endsWith("…")).to.equal(true);
  });

  it("localizes images and accounts on the device", () => {
    expect(buildBuddyPushText(chat({ type: "s3img" }))).to.deep.equal({
      title: "Goose",
      bodyLocKey: "TAXI_CHAT_IMAGE",
    });
    expect(buildBuddyPushText(chat({ type: "account" }))).to.deep.equal({
      title: "Goose",
      bodyLocKey: "TAXI_CHAT_ACCOUNT",
    });
  });

  it("titles room events with the room name", () => {
    expect(
      buildBuddyPushText(chat({ type: "in", inOutNames: ["Goose", "Cat"] }))
    ).to.deep.equal({
      title: "To Daejeon",
      bodyLocKey: "TAXI_IN",
      bodyLocArgs: ["Goose, Cat"],
    });
    expect(
      buildBuddyPushText(
        chat({ type: "departure", content: "15", author: undefined })
      )
    ).to.deep.equal({
      title: "To Daejeon",
      bodyLocKey: "TAXI_DEPARTURE",
      bodyLocArgs: ["15"],
    });
  });

  it("does not notify minigame chats", () => {
    for (const type of ["wordChain", "racing", "raceLog"] as const) {
      expect(buildBuddyPushText(chat({ type }))).to.equal(undefined);
      expect(buildBuddyPushRequest(chat({ type }), "uid", 0, 0)).to.equal(
        undefined
      );
    }
  });
});

describe("[buddyNotification] push request", () => {
  it("builds a conversation push with sender, image and options", () => {
    const request = buildBuddyPushRequest(
      chat({ type: "s3img", content: "chat-1" }),
      "recipient-uid",
      5,
      2
    )!;

    expect(request.user_uid).to.equal("recipient-uid");
    expect(request.category).to.equal("taxi_chat");
    expect(request.title).to.equal("Goose");
    expect(request.body_loc_key).to.equal("TAXI_CHAT_IMAGE");
    expect(request.body_loc_args).to.deep.equal([]);
    expect(request.data).to.include({
      category: "taxi_chat",
      type: "s3img",
      room_id: "room-1",
      room_name: "To Daejeon",
      chat_id: "chat-1",
      sender_id: "author-oid",
      sender_name: "Goose",
      sender_avatar_url: "https://example.com/goose.png",
      room_unread: "2",
      url: "/myroom/room-1",
      sent_at: "2026-10-28T09:00:00.000Z",
    });
    expect(request.data.image_url).to.match(/\/chat-img\/chat-1$/);
    expect(request.options).to.deep.equal({
      mutable_content: true,
      thread_id: "room-1",
      badge: 5,
      category: "TAXI_CHAT",
      sound: "default",
      android_data_only: true,
    });
  });

  it("marks room events as taxi_event without a sender", () => {
    const request = buildBuddyPushRequest(
      chat({ type: "arrival", content: "60", author: undefined }),
      "recipient-uid",
      0,
      0
    )!;

    expect(request.category).to.equal("taxi_event");
    expect(request.data.category).to.equal("taxi_event");
    expect(request.data).to.not.have.property("sender_id");
    expect(request.body).to.equal(null);
    expect(request.body_loc_key).to.equal("TAXI_ARRIVAL");
  });
});

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

  it("leaves rides done more than 30 days ago out of the badge", async () => {
    const [reader] = testData.users;
    const [room] = testData.rooms;
    await userModel.updateOne(
      { _id: reader._id },
      { $pull: { ongoingRoom: room._id }, $push: { doneRoom: room._id } }
    );

    expect(await getTotalUnreadCount(reader._id)).to.equal(2);

    await roomModel.updateOne(
      { _id: room._id },
      { time: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) }
    );
    expect(await getTotalUnreadCount(reader._id)).to.equal(0);
  });

  it("returns no counts for no rooms", async () => {
    expect(await getUnreadCounts("000000000000000000000000", [])).to.deep.equal(
      {}
    );
  });
});

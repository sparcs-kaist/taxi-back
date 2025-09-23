// Issue #449-1을 해결하기 위한 DB 마이그레이션 스크립트입니다.
// chat type 중 settlement와 payment를 서로 교체합니다.
// https://github.com/sparcs-kaist/taxi-back/issues/449

const { MongoClient } = require("mongodb");
const { mongo: mongoUrl } = require("@/loadenv");

const client = new MongoClient(mongoUrl);
const db = client.db("taxi");
const chats = db.collection("chats");

async function run() {
  try {
    for await (const doc of chats.find()) {
      if (doc.type === "settlement" || doc.type === "payment") {
        await chats.findOneAndUpdate(
          { _id: doc._id },
          {
            $set: {
              type: doc.type === "settlement" ? "payment" : "settlement",
            },
          }
        );
      }
    }
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}
run().then(() => {
  console.log("Done!");
});

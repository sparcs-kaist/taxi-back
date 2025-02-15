const { MongoClient } = require("mongodb");
const { mongo: mongoUrl } = require("@/loadenv");

const client = new MongoClient(mongoUrl);
const db = client.db("taxi");
const chats = db.collection("chats");
const users = db.collection("users");

async function convertUserIdToOid(userId) {
  const user = await users.findOne({ id: userId, withdraw: false }, "_id");
  if (!user) throw new Error(`User not found: ${userId}`);
  return user._id.toString();
}

async function run() {
  try {
    for await (const doc of chats.find()) {
      if (doc.type === "in" || doc.type === "out") {
        const inOutUserIds = doc.content.split("|");
        const inOutUserOids = await Promise.all(
          inOutUserIds.map(convertUserIdToOid)
        );
        await chats.updateOne(
          { _id: doc._id },
          { $set: { content: inOutUserOids.join("|") } }
        );
      } else if (doc.type === "payment" || doc.type === "settlement") {
        const userId = doc.content;
        const userOid = await convertUserIdToOid(userId);
        await chats.updateOne({ _id: doc._id }, { $set: { content: userOid } });
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}
run().then(() => {
  console.log("Done!");
});

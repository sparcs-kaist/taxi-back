// For Issue #173

const { MongoClient } = require("mongodb");
const { mongo: mongoUrl, aws: awsEnv } = require("../loadenv");

const time = Date.now();

const client = new MongoClient(mongoUrl);
const db = client.db("taxi");
const users = db.collection("users");

async function run() {
  try {
    for await (const doc of users.find()) {
      // 이미 변환이 완료된 경우에는 Pass합니다.
      if (doc.profileImageUrl.startsWith(awsEnv.s3Url)) continue;

      await users.findOneAndUpdate(
        { _id: doc._id },
        {
          $set: {
            profileImageUrl: `${awsEnv.s3Url}/profile-img/${doc.profileImageUrl}?token=${time}`,
          },
        }
      );
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

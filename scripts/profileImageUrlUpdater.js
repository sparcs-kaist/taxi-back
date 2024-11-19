// Issue #173을 해결하기 위한 DB 마이그레이션 스크립트입니다.
// https://github.com/sparcs-kaist/taxi-back/issues/173

const { MongoClient } = require("mongodb");
const { mongoUrl, aws: awsEnv } = require("../loadenv"); // FIXME: 올바른 경로로 수정해야 합니다.

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

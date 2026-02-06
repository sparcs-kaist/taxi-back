// Issue #676을 해결하기 위한 DB 마이그레이션 스크립트입니다.
// https://github.com/sparcs-kaist/taxi-back/issues/676

import { userModel, connectDatabase } from "@/modules/stores/mongo";
import { mongo as mongoUrl } from "@/loadenv";

const database = connectDatabase(mongoUrl);

const main = async () => {
  try {
    for await (const user of userModel.find()) {
      // 이미 변환이 완료된 경우에는 Pass합니다.
      if (!user.profileImageUrl.startsWith("https://")) continue;

      const profileImageUrl = new URL(user.profileImageUrl);
      await userModel.findOneAndUpdate(
        { _id: user._id },
        {
          $set: {
            profileImageUrl: `${profileImageUrl.pathname}${profileImageUrl.search}`,
          },
        }
      );
    }

    console.log("Done!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

database.on("open", main);

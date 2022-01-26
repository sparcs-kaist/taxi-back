const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs/promises");
const { body, param, validationResult } = require("express-validator");
const { userModel, roomModel } = require("../db/mongo");
const { getLoginInfo } = require("../auth/login");
const { checkProfileImage } = require("../modules/modifyProfile");
const authMiddleware = require("../middleware/auth");
const uploadProfileImage = require("../middleware/uploadProfileImage");

// 라우터 접근 시 로그인 필요
router.use(authMiddleware);

// 입력 데이터 검증을 위한 정규 표현식들
const patterns = {
  nickname: RegExp("^[A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ0-9-_ ]{3,25}$"),
};

// 새 닉네임을 받아 로그인된 유저의 닉네임을 변경합니다.
// 닉네임은 알파벳, 한글, 숫자, 공백, "-", ",", "_" 기호만을 이용해 3~25자 길이로 구성되어야 합니다.
router.post(
  "/:user_id/editNickname",
  body("nickname").matches(patterns.nickname),
  (req, res) => {
    // 닉네임 유효성 확인
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      res.status(400).send("User/:user_id/editNickname : wrong nickname");
      return;
    }

    const newNickname = req.body.nickname;

    // 닉네임을 갱신하고 결과를 반환
    userModel
      .findOneAndUpdate({ id: req.userId }, { nickname: newNickname })
      .then((result) => {
        if (result) {
          res
            .status(200)
            .send("User/:user_id/editNickname : edit user nickname successful");
        } else {
          res
            .status(400)
            .send("User/:user_id/editNickname : such user id does not exist");
        }
      })
      .catch((error) => {
        res
          .status(500)
          .send("User/:user_id/editNickname : internal server error");
      });
  }
);

// multipart form으로 프로필 사진을 업로드 받아 변경합니다.
router.post(
  "/:user_id/uploadProfileImage",
  uploadProfileImage,
  async (req, res) => {
    // 빈 파일이 아닌지 검사.
    if (!req.file) {
      return res
        .status(400)
        .send("User/:user_id/uploadProfileImage : no file uploaded");
    }

    // 사용자 검증
    const { id, sid, name } = getLoginInfo(req);
    if (!id || !sid || !name || req.params.user_id !== id) {
      await fs.unlink(path.resolve(req.file.path));
      return res
        .status(403)
        .send("User/:user_id/uploadProfileImage : not logged in");
    }

    // 이미지 파일 유효성 검사
    const isImage = await checkProfileImage(req.file.path);
    if (!isImage) {
      await fs.unlink(path.resolve(req.file.path));
      return res
        .status(400)
        .send("User/:user_id/uploadProfileImage : not an image file");
    }

    // 기존 프로필 사진의 url 갱신
    const newFilename = req.file.filename;
    let oldFilename = "";
    let needToRemove = false;

    let user = await userModel.findOne({ id: id });
    if (user) {
      try {
        const parsedOldImageUrl = user.profileImageUrl.split("/");
        oldFilename = parsedOldImageUrl[parsedOldImageUrl.length - 1];
        needToRemove =
          parsedOldImageUrl[parsedOldImageUrl.length - 2] === "user-upload";
        user.profileImageUrl = `public/profile-images/user-upload/${newFilename}`;
        await user.save();
      } catch (err) {
        // 기존 프로필 사진의 url 갱신에 실패한 경우, 새로 업로드된 파일을 삭제합니다.
        console.log(err);
        try {
          await fs.unlink(req.file.path);
          return res
            .status(500)
            .send("User/:user_id/uploadProfileImage : internal server error");
        } catch (err) {
          // 새로 업로드된 파일 삭제에도 실패한 경우
          return res
            .status(500)
            .send("User/:user_id/uploadProfileImage : internal server error");
        }
      }
    } else {
      return res
        .status(400)
        .send("User/:user_id/uploadProfileImage : such user id does not exist");
    }

    // 기존 파일 삭제
    if (oldFilename !== "" && needToRemove) {
      try {
        await fs.unlink(
          path.resolve("public/profile-images/user-upload", oldFilename)
        );
        res
          .status(200)
          .send(
            "User/:user_id/uploadProfileImage : upload profile image successful"
          );
      } catch (err) {
        console.log(err);
        res
          .status(200)
          .send(
            "User/:user_id/uploadProfileImage : upload profile image successful"
          );
      }
    }
  }
);

// 아래 라우트 메서드들은 테스트 용도로만 사용 가능
/* GET users listing. */
router.get("/", function (_, res) {
  userModel.find({}, function (err, result) {
    if (err) throw err;
    if (result) {
      res.json(result);
      //console.log(result);
    }
  });
});

router.get("/rooms", async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id).exec();
    if (user) {
      res.send({
        id: req.params.id,
        rooms: user.room,
      });
    } else {
      res.status(404).json({
        error: "user/rooms : such id does not exist",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "user/rooms : internal server error",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    let usr = await userModel.findById(req.params.id);
    if (usr) {
      res.send(usr);
    } else {
      res.status(404).json({
        error: "user/:id : such id does not exist",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "user/:id : internal server error",
    });
  }
});

// json으로 수정할 값들을 받는다
// replace/overwrite all user informations with given JSON
router.post("/:id/edit", (req, res) => {
  userModel
    .findByIdAndUpdate(req.params.id, { $set: req.body })
    .then((result) => {
      if (result) {
        res.status(200).send("edit user successful");
      } else {
        console.log("user delete error : id does not exist");
        res.status(400).send("such id does not exist");
      }
    })
    .catch((error) => {
      console.log("user edit error : " + error);
      throw error;
    });
});

// 409 Conflict
// This response is sent when a request conflicts with the current state of the server.
router.get("/:id/ban", async (req, res) => {
  let user = await userModel.findById(req.params.id);
  if (user) {
    if (user.ban === false) {
      user.ban = true;
      try {
        await user.save();
        console.log(user);
        res.status(200).send("The user banned successfully");
      } catch (err) {
        console.log(err);
        res.status(500).send("User/ban : Error 500");
      }
    } else {
      res.status(409).send("The user is already banned");
    }
  } else {
    res.status(400).send("The user does not exist");
  }
});

router.get("/:id/unban", async (req, res) => {
  let user = await userModel.findById(req.params.id);
  if (user) {
    if (user.ban === true) {
      user.ban = false;
      try {
        await user.save();
        console.log(user);
        res.status(200).send("The user unbanned successfully");
      } catch (err) {
        console.log(err);
        res.status(500).send("User/unban : Error 500");
      }
    } else {
      res.status(409).send("The user is already unbanned");
    }
  } else {
    res.status(400).send("The user does not exist");
  }
});

// Request JSON form
// { room : [ObjectID] }
router.post("/:id/participate", async (req, res) => {
  // request JSON validation
  if (!req.body.room) res.status(400).send("User/participate : Bad request");

  // Validate whether a room ObjectID is valid or not
  // And add the user ObjectID to room participants list
  try {
    let room = await roomModel.findById(req.body.room);
    if (!room) res.status(400).send("User/participate : No corresponding room");
    room.part.append(req.params.id);
    await room.save();
  } catch (error) {
    console.log(error);
    res.status(500).send("User/participate : Error 500");
  }

  try {
    let user = await userModel.findById(req.params.id);
    if (!user) res.status(400).send("The user does not exist");
    if (user.room.includes(req.body.room))
      res.status(409).send("The user already entered the room");
    user.room.append(req.body.room);
    await user.save();
    console.log(user);
    res.status(200).send("User/participate : Successful");
  } catch (error) {
    console.log(error);
    res.status(500).send("User/participate : Error 500");
  }
});

module.exports = router;

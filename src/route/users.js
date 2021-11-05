const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs/promises");
const { userModel, roomModel } = require("../db/mongo");
const { getLoginInfo } = require("../auth/login");
const { checkNickname } = require("../modules/modifyProfile");
const uploadProfileImage = require("../middleware/uploadProfileImage");

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
        throw err;
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

// 유저의 id를 받아 프로필 이미지의 url을 반환합니다.
router.get("/:user_id/getProfileImgUrl", (req, res) => {
  const user_id = req.params.user_id;
  if (false) {
    return res.status(403).send("wrong id");
  }
  userModel
    .findOne({ id: user_id }, (err, user) => {
      if (err || !user) {
        res.status(403).send("such id does not exist");
      } else {
        res.status(200).json({ profileImageUrl: user.profileImageUrl });
      }
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
});

// 새 닉네임을 받아 로그인된 유저의 닉네임을 변경합니다.
router.post("/:user_id/editNickname", (req, res) => {
  // 사용자 검증
  const { id, sid, name } = getLoginInfo(req);
  if (!id || !sid || !name || req.params.user_id !== id) {
    res.status(403).send("not logged in");
    return;
  }

  // Todo: 닉네임 유효성 확인
  const newNickname = req.body.nickname;
  if (!checkNickname(newNickname)) {
    res.status(400).send("wrong nickname");
    return;
  }

  // 닉네임을 갱신하고 결과를 반환
  userModel
    .findOneAndUpdate({ id: id }, { nickname: newNickname })
    .then((result) => {
      if (result) {
        res.status(200).send("edit user nickname successful");
      } else {
        res.status(400).send("such user id does not exist");
      }
    })
    .catch((error) => {
      console.log("user nickname edit error : " + error);
      res.status(500).json({
        error: "/:user_id/editNickname : internal server error",
      });
    });
});

// Upload profile pictures with multipart form
router.post(
  "/:user_id/uploadProfileImage",
  uploadProfileImage.single("profileImage"),
  (req, res) => {
    // 빈 파일이 아닌지 검사
    // FIXME: 이미지 파일 유효성 검사
    if (!req.file) {
      res.status(403).send("no file uploaded");
    }
    // 사용자 검증
    const { id, sid, name } = getLoginInfo(req);
    if (!id || !sid || !name || req.params.user_id !== id) {
      res.status(403).send("not logged in");
      return;
    }

    // 사진 url 정보 갱신 및 기존 파일 삭제
    const newFilename = req.file.filename;
    let oldFilename = "";
    let needToRemove = false;

    userModel
      .findOne({ id: id }, (err, user) => {
        if (err) return res.status(403).send("such user id does not exist");
        if (user) {
          const parsedOldImageUrl = user.profileImageUrl.split("/");
          oldFilename = parsedOldImageUrl[parsedOldImageUrl.length - 1];
          needToRemove =
            parsedOldImageUrl[parsedOldImageUrl.length - 2] === "default"
              ? false
              : true;
          user.profileImageUrl = `/static/profile-images/user-upload/${newFilename}`;
          user.save((err) => {
            if (err) {
              console.log(err);
              res
                .status(500)
                .send("/:user_id/uploadProfileImage : internal server error");
            }
          });
        }
      })
      .then(async () => {
        if (oldFilename !== "" && needToRemove) {
          await fs.unlink(
            path.resolve("public/profile-images/user-upload", oldFilename)
          );
        }
        res.status(200).send("upload profile image successful");
      })
      .catch((err) => {
        console.log(err);
        res
          .status(200)
          .send("upload profile image successful, however failed to delete");
      });
  }
);

module.exports = router;

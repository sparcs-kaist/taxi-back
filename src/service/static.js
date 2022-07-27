const { userModel } = require("../db/mongo");
const path = require("path");
const { validationResult } = require("express-validator");

const profileHandler = async (req, res) => {
  // 입력 데이터 검증
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    res.status(404).send("image not found");
    return;
  }

  try {
    const user = await userModel.findOne({ id: req.params.user_id });
    if (user) {
      res.sendFile(path.resolve(user.profileImageUrl));
    } else {
      res.status(404).send("image not found");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("internal server error");
  }
};

module.exports = {
  profileHandler,
};

const { userModel } = require("../db/mongo");
const path = require("path");

const profileHandler = async (req, res) => {
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

const express = require("express");
const router = express.Router();
const { userModel } = require("../db/mongo")

module.exports = (login) => {
  router.route("/").get((req, res) => {
    const user = login.getLoginInfo(req);
    res.json(user);
  });
  router.route("/detail").get((req, res) => {
    const user = login.getLoginInfo(req);

    if (user.id) {
      userModel.findOne(
        { id: user.id },
        "id withdraw ban joinat subinfo",
        (err, result) => {
          if (err) res.json({ err: true });
          else if (!result) res.json({ err: true });
          else {
            res.json({
              id: result.id,
              withdraw: result.withdraw,
              ban: result.ban,
              joinat: result.joinat,
              subinfo: result.subinfo,
            });
          }
        }
      );
    } else res.json({ id: undefined });
  });

  return router;
};

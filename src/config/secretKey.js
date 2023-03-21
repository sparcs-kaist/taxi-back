const { jwtSecretKey, frontUrl } = require("../../loadenv");

module.exports = {
  jwtSecretKey: jwtSecretKey,
  option: {
    algorithm: "HS256",
    issuer: frontUrl,
  },
};

const { jwtSecretKey, frontUrl } = require("../../security");

module.exports = {
  jwtSecretKey: jwtSecretKey,
  option: {
    algorithm: "HS256",
    issuer: frontUrl,
  },
};

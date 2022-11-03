const { jwtSecretKey, frontUrl } = require("../../security");

module.exports = {
  secretKey: jwtSecretKey,
  option: {
    algorithm: "HS256",
    issuer: frontUrl,
  },
};

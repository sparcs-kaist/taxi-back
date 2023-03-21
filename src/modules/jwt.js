const jwt = require("jsonwebtoken");
const { secretKey, option, TOKEN_EXPIRED, TOKEN_INVALID } =
  require("../../loadenv").jwt;

const signJwt = async ({ id, type }) => {
  const payload = {
    id: id,
    type: type,
  };

  const options = { ...option };

  if (type === "refresh") {
    options.expiresIn = "30d";
  }
  if (type === "access") {
    options.expiresIn = "14d";
  }

  const result = {
    token: jwt.sign(payload, secretKey, options),
  };
  return result;
};

const verifyJwt = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (err) {
    if (err.message === "jwt expired") {
      return TOKEN_EXPIRED;
    } else {
      return TOKEN_INVALID;
    }
  }
  return decoded;
};

module.exports = {
  sign: signJwt,
  verify: verifyJwt,
};

const jwt = require("jsonwebtoken");
const { secretKey, option } = require("../config/secretKey");
const { TOKEN_EXPIRED, TOKEN_INVALID } = require("../config/constants");

const signJwt = async ({ id, type }) => {
  const payload = {
    id: id,
    type: type,
  };
  if (type === "refresh") {
    option.expiresIn = "30d";
  }
  if (type === "access") {
    option.expiresIn = "7d";
  }

  const result = {
    token: jwt.sign(payload, secretKey, option),
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
    } else if (err.message === "invalid token") {
      return TOKEN_INVALID;
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

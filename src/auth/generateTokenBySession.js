const jwt = require('jsonwebtoken')

const generateTokenBySession = (loginInfo) => {
  const token = jwt.sign(loginInfo, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
  return token;
}

module.exports = generateTokenBySession;
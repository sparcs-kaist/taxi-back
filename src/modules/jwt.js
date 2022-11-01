const randToken = require('rand-token');
const jwt = require('jsonwebtoken');
const secretKey = require('../config/secretKey').secretKey;
const option = require('../config/secretKey').option;
const TOKEN_EXPIRED = -3;
const TOKEN_INVALID = -2;

const signJwt = async ({id, type}) => {
    const payload = {
        id: id,
        type: type
    };
    if (type === 'refresh') {
        option.expiresIn = '30d';
    }
    if (type === 'access') {
        option.expiresIn = '7d';
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
        if (err.message === 'jwt expired') {
            return TOKEN_EXPIRED;
        } else if (err.message === 'invalid token') {
            return TOKEN_INVALID;
        } else {
            return TOKEN_INVALID;
        }
    }
    return decoded;
};

module.exports = {
    sign: signJwt,
    verify: verifyJwt
}
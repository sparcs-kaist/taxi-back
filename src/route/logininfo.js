const express = require('express');
const router = express.Router();

module.exports = (login) => {
    router.route('/').get((req, res) => {
        const user = login.getLoginInfo(req);
        res.json(user);
    });

    return router;
}
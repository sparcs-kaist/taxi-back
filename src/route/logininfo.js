module.exports.logininfo = (login) => (req, res) => {
    const user = login.getLoginInfo(req);
    res.json(user);
}
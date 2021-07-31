function loginCheckMiddleware(login){
    return function(req, res, next) {
        if (login.isLogin(req) === false) {
            console.log("Access denied");
            console.log("loginCheck Middleware");
            res.status("403").json({
                error : "not logged in"
            })
        } else {
            next();
        }
    }
}

module.exports = loginCheckMiddleware;
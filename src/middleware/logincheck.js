function loginCheckMiddleware(login){
    return function(req, res, next) {
        if (login.isLogin(req) === false) {
            console.log("Access denied");
            console.log("loginCheck Middleware");
        } else {
            next();
        }
    }
}

module.exports = loginCheckMiddleware;
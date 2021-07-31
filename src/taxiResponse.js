function taxiResponse(err, msg, data) {
    return JSON.stringify({
        error : err,
        message : msg,
        data : data
    })
}

module.exports = taxiResponse
module.exports = {
    AuthenticateGame: function(req, res, next) {
        if (req.method === "POST") {
            if (req.body.gameID) {
                return next()
            }
        
            res.status(400).send('Game Id Is required.')
        } else {
            return next()
        }
    }
}
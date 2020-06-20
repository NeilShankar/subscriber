const mongoose = require('mongoose')
module.exports = async function (req, res) {
    require('../models/Subscription')
    const subscriptionModel = mongoose.model('Subscription')

    const retrievedSubscription = await subscriptionModel.findOne({ plrID: req.params.playerID, subscriptionName: `${req.params.subscriptionName}`, gameID: req.params.gameID })

    if (retrievedSubscription) {
        res.json({
            plrID: retrievedSubscription.plrID,
            subscriptionName: retrievedSubscription.subscriptionName,
            valid: retrievedSubscription.Valid,
            validTill: new Date(retrievedSubscription.validTill).toDateString()
        })
    } else {
        res.json({
            plrID: req.params.playerID,
            subscriptionName: req.params.subscriptionName,
            valid: false,
            validTill: null
        })
    }
}
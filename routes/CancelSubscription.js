const mongoose = require('mongoose')
module.exports = async function (req, res) {
    const receivedData = {...req.body}

    require('../models/Subscription')
    const subscriptionModel = mongoose.model('Subscription')

    const cancelledSubscription = await subscriptionModel.findOneAndUpdate({ plrID: receivedData.plrID, gameID: receivedData.gameID, subscriptionName: receivedData.subscriptionName }, {$set: { Cancelled: receivedData.Cancelled }})

    res.json({
        plrID: cancelledSubscription.plrID,
        subscriptionName: cancelledSubscription.subscriptionName,
        Cancelled: true,
        validTill: new Date(cancelledSubscription.validTill).toDateString()
    })
}
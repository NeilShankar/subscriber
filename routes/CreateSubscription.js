const mongoose = require('mongoose')
module.exports = async function (req, res) {
    const receivedData = {...req.body}
    
    try {
        require('../models/Subscription')
        const subscriptionModel = mongoose.model('Subscription')

        const preSubscribed = await subscriptionModel.findOne({ plrID: receivedData.plrID, gameID: receivedData.gameID })

        if (preSubscribed) {
            var someDate = new Date();
            var numberOfDaysToAdd = receivedData.validDays;
            someDate.setDate(someDate.getDate() + numberOfDaysToAdd);
        
            await subscriptionModel.findByIdAndUpdate(preSubscribed._id, {$set: { validTill: someDate.getTime(), Valid: true }})
        } else {
            var someDate = new Date();
            var numberOfDaysToAdd = receivedData.validDays;
            someDate.setDate(someDate.getDate() + numberOfDaysToAdd);

            const newSubscriptionInstance = new subscriptionModel({
                plrID: receivedData.plrID,
                subscriptionName: receivedData.subscriptionName,
                validTill: someDate.getTime(),
                gameID: receivedData.gameID,
                Cancelled: false,
                Valid: true
            })

            const newSub = await newSubscriptionInstance.save()

            require('../models/SubscriptionCreator')
            const creatorModel = mongoose.model('SubscriptionCreator')

            await creatorModel.findOneAndUpdate({ gameID: newSub.gameID },  { $push: { SubscriptionIds: newSub._id } })
        }

        var nowDate = new Date();
        var addDays = receivedData.validDays;
        nowDate.setDate(nowDate.getDate() + addDays);

        res.json({
            plrID: receivedData.plrID,
            validTill: nowDate.toDateString(),
            valid: true,
            failResponse: "Faced No Errors"
        })
    } catch (e) {
        res.json({
            plrID: receivedData.plrID,
            validTill: null,
            valid: false,
            failResponse: `An Error Prevented The Subscription from Being Created: ${e}`
        })
    }
}
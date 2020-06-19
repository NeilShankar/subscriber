const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
   plrID: Number,
   subscriptionName: String,
   validTill: Number,
   gameID: Number,
   Cancelled: Boolean,
   Valid: Boolean
})


const Subscription = mongoose.model('Subscription', schema)

module.exports = {Subscription, schema}
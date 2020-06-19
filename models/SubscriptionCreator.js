const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
   gameID: Number,
   Username: String,
   Password: String,
   SubscriptionIds: Array
})


const SubscriptionCreator = mongoose.model('SubscriptionCreator', schema)

module.exports = {SubscriptionCreator, schema}
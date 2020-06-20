// Route Imports
const CreateSubscription = require('./routes/CreateSubscription')
const RetrieveSubscription = require('./routes/RetrieveSubscription')
const CancelSubscription = require('./routes/CancelSubscription')

module.exports = function(app) {
    app.post("/create-subscription", CreateSubscription)
    app.get("/retrieve-subscription/:gameID/:subscriptionName/:playerID", RetrieveSubscription)
    app.post('/cancel-subscription', CancelSubscription)
}
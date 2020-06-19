const express = require("express")
const app = express()
const mongoose = require("mongoose")
const cors = require("cors")  
const bodyParser = require("body-parser")
const { response } = require("express")
const Agenda = require("agenda")

app.get("/", (req, res) => {
    res.send("API is up.")
})

app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

app.use(bodyParser.json());

const mongoURI = "mongodb+srv://subscriptionCreator:v276YdMKEh9nTB7F@cluster0-nwcym.gcp.mongodb.net/subscriptionStore?retryWrites=true&w=majority"

mongoose.connect(mongoURI, {useNewUrlParser: true,  useUnifiedTopology: true, useFindAndModify: false });

var db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));

db.once("open", function() {
console.log("Connection To MongoDB Atlas Successful!");
});

const mongoConnectionString = 'mongodb+srv://subscriptionCreator:v276YdMKEh9nTB7F@cluster0-nwcym.gcp.mongodb.net/subscriptionStore?retryWrites=true&w=majority';
 
const agenda = new Agenda({db: {address: mongoConnectionString}});

app.use(async (req, res, next) => {
    if (req.method === "POST") {
        if (req.body.gameID) {
            return next()
        }
    
        res.status(400).send('Game Id Is required.')
    } else {
        return next()
    }
})

app.use(async (req, res, next) => {

require('./models/SubscriptionCreator')
const creatorModel = mongoose.model('SubscriptionCreator')

const creatorFound = await creatorModel.findOne({ gameID: req.body.gameID })

    if (creatorFound) {
        const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
        const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')

        if (login && password && login === creatorFound.Username && password === creatorFound.Password) {
            return next()
        }

        res.set('WWW-Authenticate', 'Basic realm="401"')
        res.status(401).send('Authentication required.')
    } else {
        const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
        const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')

        if (!login || !password) {
            res.set('WWW-Authenticate', 'Basic realm="401"')
            res.status(401).send('Authentication required.')
            return;
        }

        const newCreatorInstance = new creatorModel({
            gameID: req.body.gameID,
            Username: login,
            Password: password,
            SubscriptionIds: []
        })

        await newCreatorInstance.save()

        require('./models/Subscription')
        const subscriptionModel = mongoose.model('Subscription')

        agenda.define('update subscriptions', {priority: 'high', concurrency: 10}, async job => {
            const { gameID } = job.attrs.data;
            var subscriptionIDArray = []

            await creatorModel.findOne({ gameID: gameID }, async (err, res) => {
                subscriptionIDArray = [...res.SubscriptionIds]
            })

            subscriptionIDArray.forEach(async subscription => {
                var newDate = new Date();
                var currentTime = newDate.getTime()

                if (currentTime > subscription.validTill && subscription.Cancelled === false) {
                    await subscriptionModel.findByIdAndUpdate(subscription._id, {$set: { Valid: false } })
                } else {
                    return ;
                }
            });
        });

        (async function() {
            await agenda.start();   
            await agenda.every('1 hour', 'update subscriptions', { gameID: req.body.gameID }, { skipImmediate: true });
        })();

        return next()
    }
})

app.post("/create-subscription", async (req, res) => {
    const receivedData = {...req.body}
    
    try {
        require('./models/Subscription')
        const subscriptionModel = mongoose.model('Subscription')

        const preSubscribed = await subscriptionModel.findOne({ plrID: receivedData.plrID })

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

            require('./models/SubscriptionCreator')
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
            validTill: nowDate,
            valid: true,
            failResponse: `An Error Prevented The Subscription from Being Created: ${e}`
        })
    }
})

app.get("/retrieve-subscription/:gameID/:subscriptionName/:playerID", async (req, res) => {
    require('./models/Subscription')
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
})

app.post('/cancel-subscription', async (req, res) => {
    const receivedData = {...req.body}

    require('./models/Subscription')
    const subscriptionModel = mongoose.model('Subscription')

    const cancelledSubscription = await subscriptionModel.findOneAndUpdate({ plrID: receivedData.plrID, gameID: receivedData.gameID, subscriptionName: receivedData.subscriptionName }, {$set: { Cancelled: receivedData.Cancelled }})

    res.json({
        plrID: cancelledSubscription.plrID,
        subscriptionName: cancelledSubscription.subscriptionName,
        Cancelled: cancelledSubscription.Cancelled,
        validTill: new Date(cancelledSubscription.validTill).toDateString()
    })
})

const PORT = process.env.PORT || 3000

const listener = app.listen(PORT, () => {
 console.log("Your app is listening on port " + listener.address().port);
});
const mongoose = require('mongoose')
const mongoConnectionString = `${process.env.MONGO_DB_URL}`; 
const Agenda = require("agenda")
const agenda = new Agenda({db: {address: mongoConnectionString}});

module.exports = {
    AuthenticateSession: async function(req, res, next) {

        require('../models/SubscriptionCreator')
        const creatorModel = mongoose.model('SubscriptionCreator')
        
        if (req.method === "POST") {
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
            
                require('../models/Subscription')
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
                    const subscriptionUpdater = agenda.create('update subscription', { gameID: req.body.gameID });
                    await agenda.start();
                    await subscriptionUpdater.repeatEvery('1 hour', { skipImmediate: true }).save();
                })();
            
                return next()
            }
        } else {
            const creatorFound = await creatorModel.findOne({ gameID: req.params.gameID })
        
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
                    gameID: req.params.gameID,
                    Username: login,
                    Password: password,
                    SubscriptionIds: []
                })
        
                await newCreatorInstance.save() 
                
        
                agenda.define('update subscriptions', {priority: 'high', concurrency: 10}, async job => {
                    const { gameID } = job.attrs.data;
                    var subscriptionIDArray = []

                    require('../models/Subscription')
                    const subscriptionModel = mongoose.model('Subscription')
        
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
                    const subscriptionUpdater = agenda.create('update subscription', { gameID: req.body.gameID });
                    await agenda.start();
                    await subscriptionUpdater.repeatEvery('1 hour', { skipImmediate: true }).save();
                })();
        
                return next()
            }
        }
    }
}
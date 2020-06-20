// Important Requires After This
const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const mongoose = require("mongoose")

// Middleware Imports
const AuthenticateSession = require('./middlewares/auth')
const AuthenticateGame = require('./middlewares/AuthenticateGame')

// Just a Route before authentication, which everyone can see.
app.get("/", (req, res) => {
    res.send("API is up.")
})

// Agenda And Mongoose configuration.
mongoose.connect(`${process.env.MONGO_DB_URI}`, {useNewUrlParser: true,  useUnifiedTopology: true, useFindAndModify: false });
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

db.once("open", function() {
console.log("Connection To MongoDB Atlas Successful!");
});

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// No one knows why this is required, its just required.
app.use(AuthenticateGame.AuthenticateGame)
app.use(AuthenticateSession.AuthenticateSession)

// Routes
require('./routers')(app)

// On Air~~~
const PORT = process.env.PORT || 3000
const listener = app.listen(PORT, () => {
 console.log("Your app is listening on port " + listener.address().port);
});
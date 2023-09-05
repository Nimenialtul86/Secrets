//jshint esversion:6
require('dotenv').config();
const expresss = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = expresss();
const port = 3000;

app.use(expresss.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));




// ______________________________________________________




// mongoose

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema);

// mongoose




// _____________________________________________________




// get routes

app.get("/", (req, res) => {
    res.render("home.ejs");
})

app.get("/login", (req, res) => {
    res.render("login.ejs");
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.get("/", (req, res) => {
    res.render("secrets.ejs");
});

app.get("/submit", (req, res) => {
    res.render("submit.ejs");
});

// get routes



// _________________________________________________




// post routes

app.post("/register", (req, res) => {
const newUser = new User ({
    email: req.body.username,
    password: req.body.password
})

newUser.save().then(function () {
    console.log("Success");
})
.catch(function (err) {
    console.log(err);
  });
  res.render("secrets.ejs")

});

app.post("/login", (req, res) => {
    const  username = req.body.username;
    const password = req.body.password;

    User.findOne({
        email: username
    }).then(function(foundUser) {
        if (foundUser) {
            if (foundUser.password === password) {
                res.render("secrets.ejs")
            }
        }
    })
})

// post routes




// ____________________________________________________


app.listen(port, function() {
    console.log(`Server started on port ${port}.`)
})

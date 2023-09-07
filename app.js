//jshint esversion:6
require('dotenv').config();
const expresss = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");


const app = expresss();
const port = 3000;

app.use(expresss.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "Secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


// ______________________________________________________



// mongoose

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets", 
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// mongoose




// _____________________________________________________




// get routes

app.get("/", (req, res) => {
    res.render("home.ejs");
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", (req, res) => {
    res.render("login.ejs");
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.get("/secrets", (req, res) => {
    User.find({"secret": {$ne: null}}).then(function(foundUser) {
        if (foundUser) {
            res.render("secrets.ejs", {usersSecrets: foundUser});
        }
    })
});

app.get("/logout", (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit.ejs");
    } else {
        res.redirect("/login");
    }    
});

// get routes



// _________________________________________________




// post routes

app.post("/register", (req, res) => {
    User.register({
        username: req.body.username
    }, req.body.password, function(err, user) {
        if (err) {
            console.log(err)
            res.redirect("/regiser");
        } else {
            passport.authenticate("local") (req, res, function() {
                res.redirect("/secrets")
            })
        }
    })
});

app.post("/login", (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.logIn(user, function(err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local") (req, res, function() {
                res.redirect("/secrets");
            })
        }
    })
});

app.post("/submit", (req, res) => {
    const submitSecret = req.body.secret;
    User.findById(req.user.id).then(function(foundUser) {
        if (foundUser) {
            foundUser.secret = submitSecret;
            foundUser.save().then(function() {
                res.redirect("/secrets")
            })
        }
    });
});

// post routes




// ____________________________________________________


app.listen(port, function() {
    console.log(`Server started on port ${port}.`)
})

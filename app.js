if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
//const Facts = require("./models/fact.js");
const path = require("path");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended:true}));
app.use(express.json()); 
const methodOverride = require("method-override");
app.use(methodOverride("_method"));
const ejsMate = require("ejs-mate");
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
const ExpressError = require("./utils/ExpressError.js");
// const wrapAsync = require("./utils/wrapAsync.js");  
// const {reviewSchema} = require("./schema.js");
// const Reviews = require("./models/review.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");
const userRoutes = require("./routes/user.js");

main()
.then(() => {
    console.log("Databse was connected successfully");
})
.catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/factVault");
};

const factRoutes = require("./routes/facts.js");
const reviewRoutes = require("./routes/review.js");

const sessionOptions = {
    secret: "superSecretBhai",
    resave : false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() * 10 * 24 * 60 * 60 * 1000,
        maxAge: 10 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
};

//root route
app.get("/", (req, res) => {
    res.send("Working");
});

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {    //It is not necessary but to create a explisitly middleware but for removing bulkyness of routes we use this middleware.
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.use("/facts", factRoutes);
app.use("/facts/:id/reviews", reviewRoutes);
app.use("/", userRoutes);

app.get("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found."));
})

app.use((err, req, res, next) => {
    const {statusCode=500, message="Something went wrong."} = err;
    res.status(statusCode).render("errorPage/error.ejs" ,{message});
})

app.listen(8080, () => {
    console.log("Server is listening on port 8080");
});
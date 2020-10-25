const express = require("express"),
    morgan = require("morgan"),
    bodyParser = require("body-parser"),
    uuid = require("uuid"),
    cors = require('cors'),
    moviesRouter = require('./movies/movies-router'),
    usersRouter = require('./users/users-router');

const { check, validationResult } = require('express-validator');

const mongoose = require('mongoose'),
    Models = require('./models.js');

const Movies = Models.Movie;


// mongoose.connect("mongodb://localhost:27017/myFlixDB", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

mongoose.connect(process.env.CONNECTION_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const app = express();

app.use('/movies', moviesRouter);
app.use('/users', usersRouter)

app.use(morgan('common'));
app.use(express.static("public"));
app.use(bodyParser.json());

let auth = require("./auth")(app);
const passport = require("passport");
require("./passport");

// list of allowed domains
let allowedOrigins = ['http://localhost:8080', 'http://localhost:8000'];

// allowing certain origins to be given access
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            let message = "The CORS policy for this application doesn't allow acces from origin " + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }
}));

// the root URL
app.get('/', (req, res) => {
    res.send('Welcome Movie Buffs!');
});

// error handling function
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

// listen for requests
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log("Listening on Port " + port);
});
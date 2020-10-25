const express = require("express"),
      morgan = require("morgan"),
      bodyParser = require("body-parser"),
      uuid = require("uuid"),
      cors = require('cors');

const { check, validationResult } = require('express-validator');

const mongoose = require('mongoose'),
      Models = require('./models.js');
      
const Movies = Models.Movie;
const Users = Models.User;

// mongoose.connect("mongodb://localhost:27017/myFlixDB", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

mongoose.connect( process.env.CONNECTION_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const app = express();

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
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
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

// get the list of all movies
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.find()
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

// get data about a single movie
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ Title: req.params.Title})
  .then((movie) => {
    res.json(movie);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

// get data about a genre
app.get('/movies/Genre/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({'Genre.Name': req.params.Name})
  .then((movie) => {
    res.json(movie.Genre);
  })
  .catch((err) => {
    console.erroe(err);
    res.status(500).send('Error: ' + err);
  });
});

// get data about a director
app.get('/movies/Director/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ 'Director.Name': req.params.Name})
  .then((movie) => {
    res.json(movie.Director);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

// allow new users to register
// using a chain of methods like .not().isEmpty() for validating password
// using .isLength({min: 5}) for imposing that minimum of 5 characters are only allowed for username
app.post('/users', [
  check('Username', 'Username is required').isLength({min: 5}),
  check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('EmailId', 'Email does not appear to be valid').isEmail()
  ], (req, res) => {

  // check the validation object for errors
  let errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(422).json({ errors: errors.array() });
  }

  let hashedPassword = Users.hashPassword(req.body.Password);

  Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + "already exists");
      } else {
        Users.create({
          Username: req.body.Username,
          Password: hashedPassword,
          EmailId: req.body.EmailId,
          BirthDay: req.body.BirthDay,
        })
          .then((user) => {
            res.status(201).json(user);
          })
          .catch((error) => {
            console.error(error);
            res.status(500).send("Error:" + error);
          });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// get data about a user
// app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
//   Users.findOne({ Username: req.params.Username })
//     .then((user) => {
//       res.json(user);
//     })
//     .catch((err) => {
//       console.error(err);
//       res.status(500).send("Error: " + err);
//     });
// });

// // get data about all users
// app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
//   Users.find()
//     .then((users) => {
//       res.status(201).json(users);
//     })
//     .catch((err) => {
//       console.error(err);
//       res.status(500).send("Error: " + err);
//     });
// });

// allow users to update their user info (username)
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), [
  check('Username', 'Username is required').isLength({ min: 5}),
  check('Username', 'Username conatins non alphanumeric characters - not allowed.').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('EmailId', 'Email does not appear to be valid').isEmail()
], (req, res) => {

  let errors = validationResult(req);

  if(!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array()});
  }

  let hashedPassword = Users.hashPassword(req.body.Password);
  
  Users.findOneAndUpdate({ Username: req.params.Username}, {
    $set:
    {
      Username: req.body.Username,
      Password: hashedPassword,
      EmailId: req.body.EmailId,
      BirthDay: req.body.BirthDay
    }
  },
  { new: true},
  (err, updatedUser) => {
    if(err){
      console.error(err);
      res.status(500).send('Error: ' + err);
    }
    else{
      res.json(updatedUser);
    }
  });
});

// allow users to add a movie to their list of favorites
app.post('/users/:Username/favoritemovies/:MovieID',  passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate( { Username: req.params.Username}, {
    $push: { FavoriteMovies: req.params.MovieID}
  },
  {new: true},
  (err, updatedUser) => {
    if(err){
      console.error(err);
      res.status(500).send('Error: ' + err);
    }
    else{
      res.json(updatedUser);
    }
  });
});

// allow users to remove a movie from their list of favorites
app.delete('/users/:Username/favoritemovies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate( { Username: req.params.Username}, {
    $pull: { FavoriteMovies: req.params.MovieID}
  },
  {new: true},
  (err, updatedUser) => {
    if(err){
      console.error(err);
      res.status(500).send('Error: ' + err);
    }
    else{
      res.json(updatedUser);
    }
  });
});

// allow existing users to deregister
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + " was not found");
      } 
      else {
        res.status(200).send(req.params.Username + " was deleted.");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
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
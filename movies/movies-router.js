const express = require('express')
const movieRouter = express.Router()

movieRouter
    .get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
        Movies.find()
            .then((movies) => {
                res.status(201).json(movies);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send("Error: " + err);
            });
    })
    .get('/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
        Movies.findOne({ Title: req.params.Title })
            .then((movie) => {
                res.json(movie);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    })
    .get('/Genre/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
        Movies.findOne({ 'Genre.Name': req.params.Name })
            .then((movie) => {
                res.json(movie.Genre);
            })
            .catch((err) => {
                console.erroe(err);
                res.status(500).send('Error: ' + err);
            });
    })
    .get('/Director/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
        Movies.findOne({ 'Director.Name': req.params.Name })
            .then((movie) => {
                res.json(movie.Director);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    });

module.exports = movieRouter
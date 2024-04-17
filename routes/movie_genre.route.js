var express = require('express');
var movieGenreController = require('../controllers/movie_genre.controller');

var api = express.Router();

api.get('/getMoviesGenres',movieGenreController.getMoviesGenres);

module.exports = api;
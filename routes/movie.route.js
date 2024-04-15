var express = require('express');
var movieController = require('../controllers/movie.controller');

var api = express.Router();

api.get('/getMovies',movieController.getMovies);

module.exports = api;
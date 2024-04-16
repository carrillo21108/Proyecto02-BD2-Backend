var express = require('express');
var movieController = require('../controllers/movie.controller');

var api = express.Router();

api.get('/getMovies',movieController.getMovies);
api.post('/genreRecommendation',movieController.genreRecommendation);
api.post('/userRecommendation',movieController.userRecommendation);
api.post('/popularRecommendation',movieController.popularRecommendation);
api.post('/releaseRecommendation',movieController.releaseRecommendation);
api.get('/getMoviesCount',movieController.getMoviesCount);
api.post('/getMoviesDetail',movieController.getMoviesDetail);

module.exports = api;
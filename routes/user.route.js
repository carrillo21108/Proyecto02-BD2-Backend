var express = require('express');
var userController = require('../controllers/user.controller');

var api = express.Router();

api.post('/login',userController.login);
api.post('/createUser',userController.create);
api.post('/inLikeMovie',userController.likeMovie);
api.post('/disLikeMovie',userController.dislikeMovie);
api.post('/inLikeGenre',userController.likeGenre);
api.post('/disLikeGenre',userController.dislikeGenre);
api.post('/profile',userController.profile);
//  api.post('/getLikesUser',userController.getLikesUser);
api.post('/getLikeUserMovie',userController.getLikeUserMovie);
//  api.post('/getLikesGenre',userController.getLikesGenre);
api.post('/updateUser',userController.updateUser);
api.post('/deleteUser',userController.deleteUser); //Nuevo
api.post('/wantToSeeMovie',userController.wantToSeeMovie);
api.post('/notWantToSee',userController.notWantToSee);
api.post('/getWantToSee',userController.getWantToSee);
api.post('/hasSeen',userController.hasSeenMovie);
api.post('/notHasSeen',userController.notHasSeen);
api.post('/getHasSeen',userController.getHasSeen);
api.post('/getHowManyMoviesLikedUser',userController.getHowManyMoviesLikedUser);
api.post('/getHowManyMoviesAvgUser',userController.getAvgMoviesVotesUser);
api.get('/getGenreCount',userController.getGenreCount);
api.get('/getMovieGenreCount',userController.getMovieGenreCount);
module.exports = api;
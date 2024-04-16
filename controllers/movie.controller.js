var session = require('../connection');


function getMoviesCount(req, res) {
    session
    .run('MATCH (m:Movie) RETURN count(m) AS movieCount')
    .then(function(result) {
        const movieCount = result.records[0].get('movieCount').toInt();
        res.send({message: movieCount});
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}


function getMovies(req,res){
    var resRecord = [];

    session
    .run('MATCH (n:Movie) RETURN n')
    .then(function(result){
        result.records.forEach(function(record){
            resRecord.push(record._fields[0].properties);
        });
        
        if(resRecord.length==0){
            res.send({message:"Peliculas no encontradas."});
        }else{
            res.send(resRecord);
        }
    })
    .catch(function(err){
        console.log(err);
        res.status(500).send({message:'Error general'});
    });
}

function getMoviesDetail(req, res) {
    var params = req.body;

    var movies = params.movies.split(",");
    var query = 'MATCH (m:Movie) WHERE m.id IN $movieIds RETURN m';

    session
    .run(query, { movieIds: movies })
    .then(function(result) {
        var moviesDetail = result.records.map(record => record.get('m').properties);

        if (moviesDetail.length == 0) {
            res.send({message: "Peliculas no encontradas."});
        } else {
            res.send(moviesDetail);
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}


function genreRecommendation(req, res) {
    var params = req.body;
    var genres = params.genres.split(",");
    var genresList = genres.map(genre => parseInt(genre, 10)); // Asegurarse de que son enteros

    var skip = params.skip;
    var limit = params.limit;

    var query = `
    MATCH (m:Movie)
    WHERE any(genre IN m.genre_ids WHERE genre IN $genresList)
    RETURN m AS Movie
    SKIP toInteger($skip)
    LIMIT toInteger($limit)
    `;

    session
    .run(query, { genresList: genresList, skip: skip, limit: limit })
    .then(function(result) {
        var moviesDetail = result.records.map(record => record.get('Movie').properties);

        if (moviesDetail.length == 0) {
            res.send({message: "Peliculas no encontradas."});
        } else {
            res.send(moviesDetail);
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}




function userRecommendation(req, res) {
    var params = req.body;
    var genres = params.genres.split(",");
    var genresList = genres.map(genre => parseInt(genre));
    var mail = params.mail;
    var skip = parseInt(params.skip);
    var limit = parseInt(params.limit);

    var query = `
    MATCH (u:User)-[:LIKES_GENRE]->(g:Genre)
    WHERE g.id IN $genresList AND NOT u.credentials.mail = $mail
    WITH u, collect(g) as likedGenres
    UNWIND u.likedMovies AS movieId
    RETURN DISTINCT movieId AS MovieID
    SKIP toInteger($skip)
    LIMIT toInteger($limit)
    `;

    session
    .run(query, { genresList: genresList, mail: mail, skip: skip, limit: limit })
    .then(function(result) {
        var recommendedMovies = result.records.map(record => record.get('MovieID'));

        if (recommendedMovies.length == 0) {
            res.send({message: "Peliculas no encontradas."});
        } else {
            res.send(recommendedMovies);
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}


function popularRecommendation(req, res) {
    var params = req.body;
    var skip = parseInt(params.skip);
    var limit = parseInt(params.limit);

    var query = `
    MATCH (m:Movie)
    WHERE m.vote_average >= 8 AND m.vote_count >= 500
    RETURN m AS Movie
    ORDER BY m.popularity DESC
    SKIP toInteger($skip)
    LIMIT toInteger($limit)
    `;

    session
    .run(query, { skip: skip, limit: limit })
    .then(function(result) {
        var popularMovies = result.records.map(record => record.get('Movie').properties);

        if (popularMovies.length == 0) {
            res.send({message: "Peliculas no encontradas."});
        } else {
            res.send(popularMovies);
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}

function releaseRecommendation(req, res) {
    var params = req.body;
    var skip = parseInt(params.skip);
    var limit = parseInt(params.limit);

    var query = `
    MATCH (m:Movie)
    WHERE m.vote_average >= 5 AND m.vote_count >= 100
    AND m.release_date >= '2024-01-01' AND m.release_date <= '2024-04-15'
    RETURN m AS Movie
    ORDER BY m.release_date DESC
    SKIP toInteger($skip)
    LIMIT toInteger($limit)
    `;

    session
    .run(query, { skip: skip, limit: limit })
    .then(function(result) {
        var recentMovies = result.records.map(record => record.get('Movie').properties);

        if (recentMovies.length == 0) {
            res.send({message: "Peliculas no encontradas."});
        } else {
            res.send(recentMovies);
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}




module.exports = {
    getMovies,
    getMoviesCount,
    popularRecommendation,
    releaseRecommendation,
    genreRecommendation,
    userRecommendation,
    getMoviesDetail
}

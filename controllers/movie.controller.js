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

    var movieIds = params.movies.split(",").map(id => parseInt(id));
    
    var query = 'MATCH (m:Movie) WHERE ID(m) IN $movieIds RETURN m';

    session
    .run(query, { movieIds: movieIds })
    .then(function(result) {
        var moviesDetail = result.records.map(record => {
            return record.get('m').properties;
        });

        if (moviesDetail.length == 0) {
            res.send({message: "Películas no encontradas."});
        } else {
            res.send(moviesDetail);
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}



function genreRecommendation(req,res){
    var resRecord = [];
    var params = req.body;

    var skip = parseInt(params.skip);
    var limit = parseInt(params.limit);
    var mail = params.mail;

    var query = `MATCH (a:User)-[:FAVORITE]->(genre)<-[:BELONGS_TO]-(b:Movie) 
                WHERE a.mail=$mail AND b.vote_average >= 5 AND b.vote_count >= 100
                RETURN DISTINCT b
                ORDER BY rand()
                SKIP toInteger($skip) 
                LIMIT toInteger($limit)`;

    session
    .run(query, { mail: mail, skip: skip, limit: limit })
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

function userRecommendation(req, res) {
    var params = req.body;
    var mail = params.mail;
    var skip = parseInt(params.skip);
    var limit = parseInt(params.limit);

    var query = `
    MATCH (u:User)-[:FAVORITE]->(g:Movie_Genre)<-[:FAVORITE]-(b:User)-[:LIKES]->(movie:Movie)
    WHERE u.mail = $mail AND u.mail <> b.mail
    RETURN DISTINCT movie
    ORDER BY movie.popularity DESC
    SKIP toInteger($skip)
    LIMIT toInteger($limit)
`;

    session
    .run(query, { mail: mail, skip: skip, limit: limit })
    .then(function(result) {
        var recommendedMovies = result.records.map(record => {
            return record.get('movie').properties;
        });

        if (recommendedMovies.length == 0) {
            res.send({message: "Películas no encontradas."});
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
    WHERE m.vote_average >= 6 AND m.vote_count >= 500
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
    AND m.release_date >= '2023-12-01' AND m.release_date <= '2024-04-15'
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

function getMovieCast(req,res){
    var params = req.body;
    var resRecord = [];

    var query = `
    MATCH (n:Actor)-[r:ACTED_IN]->(m:Movie{id:$movieId})
    RETURN n
    `;

    session
    .run(query,{movieId:parseInt(params.movieId)})
    .then(function(result){
        result.records.forEach(function(record){
            resRecord.push(record._fields[0].properties);
        });
        
        if(resRecord.length==0){
            res.send({message:"Actores no encontrados."});
        }else{
            res.send(resRecord);
        }
    })
    .catch(function(err){
        console.log(err);
        res.status(500).send({message:'Error general'});
    });
}

module.exports = {
    getMovies,
    getMoviesCount,
    popularRecommendation,
    releaseRecommendation,
    genreRecommendation,
    userRecommendation,
    getMoviesDetail,
    getMovieCast
}

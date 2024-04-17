var session = require('../connection');

function getMoviesGenres(req, res) {
    var query = 'MATCH (g:Movie_Genre) RETURN g';

    session
    .run(query)
    .then(function(result) {
        var genres = result.records.map(record => record.get('g').properties);

        if (genres.length === 0) {
            res.send({message: "Géneros no encontrados."});
        } else {
            res.send(genres);
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}

module.exports = {
    getMoviesGenres
}

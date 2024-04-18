var session = require('../connection');
const Chartist    = require('chartist');
const chartistSvg = require('chartist-svg');
function login(req,res){
    var params = req.body;
    var query = `
        MATCH(n:User) WHERE n.mail=$mail AND n.password=$password RETURN n
    `;
    var resRecord = [];
    
    session
    .run(query,{
        mail:params.mail,
        password:params.password
    })
    .then(function(result){
        result.records.forEach(function(record){
            resRecord.push(record._fields[0].properties);
        });
        
        if(resRecord.length==0){
            res.send({message:"Contraseña y/o correo electrónico incorrecto."});
        }else{
            res.send(resRecord);
        }
    })
    .catch(function(err){
        console.log(err);
        res.status(500).send({message:'Error general'});
    });
}

function create(req,res){
    var params = req.body;
    var query = `
        CREATE (u:User {
            id: apoc.create.uuid(),
            name: $name,
            lastname: $lastname,
            age: $age,
            mail: $mail,
            password: $password
        })
        WITH u
        MATCH (g:Genre {id: $genderId})
        SET g.popularity=g.popularity+1
        MERGE (u)-[:HAS]->(g)
        RETURN u, g
    `;

    session
    .run(query,{
        name: params.name,
        lastname: params.lastname,
        age: parseInt(params.age), // Asegurar que la edad es un número
        mail: params.mail,
        password: params.password,
        genderId: parseInt(params.gender) // Asumiendo que 'gender' es el ID correcto del género
    })
    .then(function(result){
        if (result.records.length > 0) {
            res.send({ message: 'Usuario agregado con éxito a la DB y vinculado al género.' });
        } else {
            res.send({ message: 'Género no encontrado.' });
        }
    })
    .catch(function(err){
        console.log(err);
        res.status(500).send({message:'Error general'});
    });
}

function profile(req,res){
    var params = req.body;
    var query = `
        MATCH(n:User) WHERE n.mail=$mail RETURN n
    `;

    var resRecord = [];

    session
    .run(query,{
        mail:params.mail
    })
    .then(function(result){
        result.records.forEach(function(record){
            resRecord.push(record._fields[0].properties);
        });

        if(resRecord.length==0){
            res.send({message:"Perfil de usuario no encontrado."});
        }else{
            res.send(resRecord[0]);
        }
    })
    .catch(function(err){
        console.log(err);
        res.status(500).send({message:'Error general'});
    });
}

function updateUser(req,res){
    var params = req.body;
    var resRecord = [];
    var query = `
        MATCH(n:User) WHERE n.mail=$currentMail SET n.mail=$mail, n.password=$password, n.age=$age RETURN n
    `;

    session
    .run(query,{
        currentMail:params.currentMail,
        mail:params.mail,
        password:params.password,
        age:parseInt(params.age)
    })
    .then(function(result){
        result.records.forEach(function(record){
            resRecord.push(record._fields[0].properties);
        });
        
        if(resRecord.length==0){
            res.send({message:'Usuario no actualizado'});
        }else{
            res.send(resRecord[0]);
        }
    })
    .catch(function(err){
        console.log(err);
        res.status(500).send({message:'Error general'});
    });
}

function deleteUser(req, res) {
    var params = req.body;
    var query = `
        MATCH (u:User {mail: $mail})-[r:HAS]->(g:Genre)
        SET g.popularity = g.popularity - 1
        WITH u, g
        DETACH DELETE u
        RETURN g
    `;

    session
        .run(query, {
            mail: params.mail
        })
        .then(function(result) {
            // Usamos `containsUpdates()` para comprobar si se realizaron cambios en la base de datos.
            if (result.summary.counters.containsUpdates()) {
                res.send({ message: 'Usuario eliminado con éxito de la DB y desvinculado del género.' });
            } else {
                res.send({ message: 'Usuario no encontrado o no está vinculado a ningún género.' });
            }
        })
        .catch(function(err) {
            console.log(err);
            res.status(500).send({ message: 'Error general en la base de datos' });
        });
}

function likeGenre(req, res) {
    var params = req.body;

    var query = `
    MATCH (u:User {mail: $mail }), (g:Movie_Genre {id: $genreId})
    MERGE (u)-[f:FAVORITE]->(g)
    RETURN u, f, g
    `;

    session
    .run(query, { mail: params.mail, genreId: parseInt(params.genreId) })
    .then(function(result) {
        if (result.records.length === 0) {
            res.send({message: 'Relación FAVORITE no creada.'});
        } else {
            var favorite = result.records[0].get('f');
            res.send({message: 'Relación FAVORITE creada con éxito.', favorite: favorite});
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}

function dislikeGenre(req, res) {
    var params = req.body;

    var query = `
    MATCH (u:User { mail: $mail })-[f:FAVORITE]->(g:Movie_Genre {id: $genreId})
    DELETE f
    RETURN u, g
    `;

    session
    .run(query, { mail: params.mail, genreId: parseInt(params.genreId) })
    .then(function(result) {
        if (result.records.length === 0) {
            res.send({message: 'Relación FAVORITE no eliminada.'});
        } else {
            res.send({message: 'Relación FAVORITE eliminada con éxito.'});
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}


function getLikeUserMovie(req, res) {
    var params = req.body;

    var query = `
    MATCH (u:User { mail: $mail })-[l:LIKES]->(m:Movie {id: toInteger($movieId)})
    RETURN m
    `;

    session
    .run(query, { mail: params.mail, movieId: params.movieId })
    .then(function(result) {
        if (result.records.length === 0) {
            res.send({message: "Pelicula sin like de usuario."});
        } else {
            res.send({message: "Pelicula con like de usuario."});
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}

function likeMovie(req, res) {
    var params = req.body;

    var query = `
    MATCH (u:User { mail: $mail }), (m:Movie {id: toInteger($movieId)})
    MERGE (u)-[r:LIKES]->(m)
    RETURN u, m, r
    `;

    session
    .run(query, { mail: params.mail, movieId: params.movieId })
    .then(function(result) {
        if (result.records.length === 0) {
            res.send({message: 'Relación LIKES no creada.'});
        } else {
            // Puedes elegir devolver toda la relación o simplemente una confirmación
            var relationship = result.records[0].get('r');
            res.send({message: 'Relación LIKES creada con éxito.', relationship: relationship});
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}

function dislikeMovie(req, res) {
    var params = req.body;

    var query = `
    MATCH (u:User {mail: $mail })-[r:LIKES]->(m:Movie {id: toInteger($movieId)})
    DELETE r
    RETURN u, m
    `;

    session
    .run(query, { mail: params.mail, movieId: params.movieId })
    .then(function(result) {
        // La eliminación fue exitosa, pero como eliminamos la relación, no habrá registros que devolver
        if (result.records.length === 0) {
            res.send({message: 'Relación LIKES eliminada con éxito.'});
        } else {
            // Si hay registros, eso significa que no se encontró la relación para eliminar
            res.send({message: 'Relación LIKES no eliminada.'});
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}

function getWantToSee(req, res) {
    var params = req.body;

    var query = `
    MATCH (u:User { mail: $mail })-[l:WANT_TO_SEE]->(m:Movie {id: toInteger($movieId)})
    RETURN m
    `;

    session
    .run(query, { mail: params.mail, movieId: params.movieId })
    .then(function(result) {
        if (result.records.length === 0) {
            res.send({message: "Pelicula que no quiere ver el usuario."});
        } else {
            res.send({message: "Pelicula que quiere ver el usuario."});
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}

function wantToSeeMovie(req, res) {
    var params = req.body;

    var query = `
    MATCH (u:User { mail: $mail }), (m:Movie {id: toInteger($movieId)})
    MERGE (u)-[r:WANT_TO_SEE]->(m)
    RETURN u, m, r
    `;

    session
    .run(query, { mail: params.mail, movieId: params.movieId })
    .then(function(result) {
        if (result.records.length === 0) {
            res.send({message: 'Relacion WANT_TO_SEE no creada.'});
        } else {
            // Puedes elegir devolver toda la relación o simplemente una confirmación
            var relationship = result.records[0].get('r');
            res.send({message: 'Relacion WANT_TO_SEE creada con éxito.', relationship: relationship});
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}

function notWantToSee(req, res) {
    var params = req.body;

    var query = `
    MATCH (u:User {mail: $mail })-[r:WANT_TO_SEE]->(m:Movie {id: toInteger($movieId)})
    DELETE r
    RETURN u, m
    `;

    session
    .run(query, { mail: params.mail, movieId: params.movieId })
    .then(function(result) {
        // No hay registros, eso significa que no se encontró la relación para eliminar
        if (result.records.length === 0) {
            res.send({message: 'Relacion WANT_TO_SEE no eliminada.'});
        } else {
            // Si hay registros, eso significa que retorna un registro
            res.send({message: 'Relacion WANT_TO_SEE eliminada con éxito.'});
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}

function getHasSeen(req, res) {
    var params = req.body;

    var query = `
    MATCH (u:User { mail: $mail })-[l:HAS_SEEN]->(m:Movie {id: toInteger($movieId)})
    RETURN m
    `;

    session
    .run(query, { mail: params.mail, movieId: params.movieId })
    .then(function(result) {
        if (result.records.length === 0) {
            res.send({message: "Pelicula que no ha visto el usuario."});
        } else {
            res.send({message: "Pelicula que ha visto el usuario."});
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}

function hasSeenMovie(req, res) {
    var params = req.body;

    var query = `
    MATCH (u:User { mail: $mail }), (m:Movie {id: toInteger($movieId)})
    MERGE (u)-[r:HAS_SEEN]->(m)
    RETURN u, m, r
    `;

    session
    .run(query, { mail: params.mail, movieId: params.movieId })
    .then(function(result) {
        if (result.records.length === 0) {
            res.send({message: 'Relacion HAS_SEEN no creada.'});
        } else {
            // Puedes elegir devolver toda la relación o simplemente una confirmación
            var relationship = result.records[0].get('r');
            res.send({message: 'Relacion HAS_SEEN creada con éxito.', relationship: relationship});
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}

function notHasSeen(req, res) {
    var params = req.body;

    var query = `
    MATCH (u:User {mail: $mail })-[r:HAS_SEEN]->(m:Movie {id: toInteger($movieId)})
    DELETE r
    RETURN u, m
    `;

    session
    .run(query, { mail: params.mail, movieId: params.movieId })
    .then(function(result) {
        // No hay registros, eso significa que no se encontró la relación para eliminar
        if (result.records.length === 0) {
            res.send({message: 'Relacion HAS_SEEN no eliminada.'});
        } else {
            // Si hay registros, eso significa que retorna un registro
            res.send({message: 'Relacion HAS_SEEN eliminada con éxito.'});
        }
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}

function getHowManyMoviesLikedUser(req, res) {
    var params = req.body;
    var query = `
    MATCH (p:User{mail:$mail})-[:LIKES]->(m:Movie)
    return count(*) As movieCount
    `;
    session
    .run(query, { mail: params.mail})
    .then(function(result) {
        res.send({movies_liked: result.records[0].get('movieCount').low});
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}
function getAvgMoviesVotesUser(req, res) {
    var params = req.body;
    var query = `
    MATCH (p:User{mail:$mail})-[:LIKES]->(m:Movie)
    return avg(m.vote_average) as avgUserVotes
    `;
    
    session
    .run(query, { mail: params.mail})
    .then(function(result) {
        res.send({avgUserVotes: result.records[0].get('avgUserVotes')});
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}
function getGenreCount(req, res) {
    var query = `
    MATCH (k:User|Actor|Director)-[:IS]->(g:Genre)
    WITH g.name AS genero, count(g) AS genreCount
    RETURN genero, genreCount;
    `;
    
    session
    .run(query)
    .then(function(result) {
        
        var data = {
            title: 'Genre Chart',
            subtitle: 'Distribution of genres',
            labels: result.records.map((genre)=>genre.get("genero")),
            series: result.records.map((genre)=>genre.get("genreCount").low)
        };
        const options = {
            Width:1000,
            chartPadding: {
              right: 40
            }
          }
        chartistSvg('bar', data, options).then(svg => res.send(svg));
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}
function getMovieGenreCount(req, res) {
    var query = `
    MATCH (k:User)-[:FAVORITE]->(g:Movie_Genre)
    WITH g.name AS genero, count(g) AS genreCount
    RETURN genero, genreCount;
    `;
    
    session
    .run(query)
    .then(function(result) {
        
        var data = {
            title: 'Movie Genre Chart',
            subtitle: 'Distribution of Movie Genres',
            labels: result.records.map((genre)=>genre.get("genero")),
            series: result.records.map((genre)=>genre.get("genreCount").low)
        };
        const options = {
            Width:1000,
            chartPadding: {
              right: 40
            }
          }
        
        chartistSvg('bar', data, options).then(svg => {
            const str = new String(svg);
            res.send({"text":str.toString()})});
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send({message: 'Error general'});
    });
}

module.exports = {
    login,
    create,
    profile,
    updateUser,
    deleteUser,
    likeGenre,
    dislikeGenre,
    getLikeUserMovie,
    likeMovie,
    dislikeMovie,
    wantToSeeMovie,
    notWantToSee,
    getWantToSee,
    getHasSeen,
    hasSeenMovie,
    notHasSeen,
    getHowManyMoviesLikedUser,
    getAvgMoviesVotesUser,
    getGenreCount,
    getMovieGenreCount
}
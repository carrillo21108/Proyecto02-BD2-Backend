var session = require('../connection');

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
            res.status(404).send({message:"Contraseña y/o correo electrónico incorrecto."});
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
            res.status(404).send({ message: 'Género no encontrado.' });
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
            res.status(404).send({message:"Perfil de usuario no encontrado."});
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
            console.log(result);
            // Usamos `containsUpdates()` para comprobar si se realizaron cambios en la base de datos.
            if (result.summary.counters.containsUpdates()) {
                res.send({ message: 'Usuario eliminado con éxito de la DB y desvinculado del género.' });
            } else {
                res.status(404).send({ message: 'Usuario no encontrado o no está vinculado a ningún género.' });
            }
        })
        .catch(function(err) {
            console.log(err);
            res.status(500).send({ message: 'Error general en la base de datos' });
        });
}


module.exports = {
    login,
    create,
    profile,
    updateUser,
    deleteUser
}
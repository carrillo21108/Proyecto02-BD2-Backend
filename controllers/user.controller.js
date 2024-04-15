var session = require('../connection');

function login(req,res){
    var params = req.body;
    var resRecord = [];
    
    session
    .run('MATCH (n:User) WHERE n.mail="'+params.mail+'" AND n.password="'+params.password+'"RETURN n')
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
    session
    .run("CREATE (:User{id:apoc.create.uuid()"+",name:'"+params.name+"',lastname:'"+params.lastname+"',age:"+params.age+",mail:'"+params.mail+"',password:'"+params.password+"'})")
    .then(function(){
        res.send({message:'Usuario agregado con exito a la DB.'});
    })
    .catch(function(err){
        console.log(err);
        res.status(500).send({message:'Error general'});
    });
}

module.exports = {
    login,
    create
}
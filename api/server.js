process.env.TMPDIR = '.';

const express = require('express');
const bodyParser = require('body-parser');
const multiparty = require('connect-multiparty');
const mongodb = require('mongodb');
const ObjectID = require('mongodb').ObjectID;
const fs = require('fs');

var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(multiparty());
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});

const port = 8080;

app.listen(port);
console.log(`Servidor escutando na porta ${port}`);

let DB = new mongodb.Db(
    'instagram',
    new mongodb.Server('localhost', 27017)
);

app.get('/', function(req, res){
    res.send({
        msg: 'Olá'
    });
});

app.post('/api', function(req, res) {
    let filename = `${(new Date()).getTime()}-${req.files.arquivo.originalFilename}`;

    let p = new Promise(function(resolve, reject) {
        let mv = require('mv');
 
        mv(req.files.arquivo.path, `./uploads/${filename}`, function(err) {
            if(err) {
                reject(err);
                return;
            } 
            resolve();
        });        
    });

    p.then(function() {
        DB.open().then(function(db) {
            db.collection('postagens', function(err, collection) {
                collection.insert({
                    titulo: req.body.titulo,
                    url_imagem: filename
                }).then(function(records) {
                    res.status(200).json(records);
                }).catch(function(err) {
                    res.status(500).json(err);
                }).then(function() {
                    console.log('closed');
                    DB.close();
                });
            });
        }).catch(function(err) {
            res.status(500).json(err);
        });
    }).catch(function(err) {
        res.status(500).json({error: err});
    });
        

});

app.get('/api', function(req, res) {
    DB.open().then(function(db) {
        db.collection('postagens', function(err, collection) {
            collection.find()
                .toArray().then(function(records) {
                    res.json(records);
                }).catch(function(err) {
                    res.json(err);
                }).then(function() {
                    console.log('closing database');
                    DB.close();
                });
        });
    }).catch(function(err) {
        res.json(err);
    });
});

app.get('/api/:id', function(req, res) {
    DB.open().then(function(db) {
        db.collection('postagens', function(err, collection) {
            collection.find(ObjectID(req.params.id))
                .toArray().then(function(records) {
                    res.json(records);
                }).catch(function(err) {
                    res.json(err);
                }).then(function() {
                    console.log('closing database');
                    DB.close();
                });
        });
    }).catch(function(err) {
        res.json(err);
    });
});

app.get('/media/:imagem', function(req, res) {
    fs.readFile(`./uploads/${req.params.imagem}`, function(err, content) {
        if(err) {
            res.status(404).json(err);
            return;
        }
        // res.setHeader('Content-type', 'image/jpeg');
        res.writeHead(200, {
            'Content-type': 'image/jpg'
        });
        res.end(content);
    });
});

app.put('/api/:id', function(req, res) {
    DB.open().then(function(db) {
        db.collection('postagens', function(err, collection) {
            collection.update({
                _id: ObjectID(req.params.id)
            }, {
                $push: {
                    comentarios: {
                        id_comentario: new ObjectID(),
                        comentario: req.body.comentario
                    }
                }
            }).then(function(records) {
                res.json(records);
            }).catch(function(err) {
                res.json(err);
            }).then(function() {
                DB.close();
            });
        });
    }).catch(function(err) {
        res.json(err);
    });
});

app.delete('/api/:id', function(req, res) {
    DB.open().then(function(db) {
        db.collection('postagens', function(err, collection) {
            collection.deleteOne({
                _id: ObjectID(req.params.id)
            }).then(function(records) {
                res.json(records);
            }).catch(function(err) {
                res.json(err);
            }).then(function() {
                DB.close();
            });
        });
    }).catch(function(err) {
        res.json(err);
    });
});

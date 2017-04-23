const express = require('express');
const bodyParser = require('body-parser');
const multiparty = require('connect-multiparty');
const mongodb = require('mongodb');
const ObjectID = require('mongodb').ObjectID;

var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(multiparty());

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
    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:80');
    res.setHeader('Access-Control-Allow-Origin', '*');

    DB.open().then(function(db) {
        db.collection('postagens', function(err, collection) {
            collection.insert(req.body)
                .then(function(records) {
                    res.json(records);
                }).catch(function(err) {
                    res.json(err);
                }).then(function() {
                    console.log('closed');
                    DB.close();
                });
        });
    }).catch(function(err) {
        res.json(err);
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

app.put('/api/:id', function(req, res) {
    DB.open().then(function(db) {
        db.collection('postagens', function(err, collection) {
            collection.update({
                _id: ObjectID(req.params.id)
            }, {
                $set: {
                    titulo: req.body.titulo
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
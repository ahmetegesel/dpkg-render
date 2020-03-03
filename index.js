const express = require('express');
const path = require('path');
const dpkgProvider = require('./dpkgProvider');

const router = express.Router();

const app = express();

const provider = new dpkgProvider();

router.get('/', (req, res) => res.sendFile(path.join(__dirname + '/Views/index.html')));
router.get('/packages', (req, res) => res.json(provider.provide()))
router.get('/packages/:name', (req, res) => res.json(provider.getPackage(req.params.name)));
router.get('/:name', (req, res) => res.sendFile(path.join(__dirname + '/Views/package.html')));


app.use(express.static(__dirname + '/Views'));
app.use('/', router);

app.listen(8080, () => console.log('localhost:8080'))

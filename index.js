const express = require('express');
const path = require('path');
const DpkgStatus = require('./DpkgStatus');

const router = express.Router();

const app = express();

const dpkgStatus = new DpkgStatus();

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

router.get('/', (req, res) => res.render('index', {
  packages: dpkgStatus.getPackageNames()
}));
router.get('/package/:name', (req, res) => res.render('package', {
  name: req.params.name,
  ...dpkgStatus.getPackage(req.params.name)
}));


app.use('/', router);

app.listen(8080, () => console.log('localhost:8080'))

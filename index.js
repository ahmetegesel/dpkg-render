import express from 'express';
import path from 'path';

import './config';

import DpkgStatus from './src/DpkgStatus';

const app = express();

const router = express.Router();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const dpkgStatus = new DpkgStatus();
router.get('/', (req, res) => res.render('index', {
  packages: dpkgStatus.getPackageNames(),
}));
router.get('/package/:name', (req, res) => res.render('package', {
  name: req.params.name,
  ...dpkgStatus.getPackage(req.params.name),
}));

app.use('/', router);

// eslint-disable-next-line no-console
app.listen(8080, () => console.log('localhost:8080'));

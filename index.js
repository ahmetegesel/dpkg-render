import express from 'express';
import path from 'path';
import './config';
import DpkgStatus from './src/DpkgStatus';

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const dpkgStatus = new DpkgStatus();
app.get('/', (req, res) => res.render('index', {
  packages: dpkgStatus.getPackageNames(),
}));
app.get(
  '/package/:name',
  (req, res) => res.render('package', dpkgStatus.getPackage(req.params.name)),
);

// eslint-disable-next-line no-console
app.listen(8080, () => console.log('localhost:8080'));

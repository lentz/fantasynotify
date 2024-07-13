import * as fs from 'fs';
import * as https from 'https';

import bodyParser from 'body-parser';
import express from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import morgan from 'morgan';
import * as handlebarsExpress from 'express-handlebars';
import './db.js';
import * as controller from './controller.js';

const app = express();

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
);
app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: false }));
const handlebars = handlebarsExpress.create({
  defaultLayout: undefined,
  extname: '.hbs',
});
app.engine('.hbs', handlebars.engine);
app.set('view engine', '.hbs');

app.get('/', controller.index);
app.post('/signup', controller.signup);
app.get('/auth/callback', controller.authCallback);
app.get('/unsubscribe/:id', controller.unsubscribe);
app.use(controller.handleError);

let server;
try {
  fs.accessSync('../key.pem');

  /* Dev HTTPS */
  server = https.createServer(
    {
      key: fs.readFileSync('../key.pem'),
      cert: fs.readFileSync('../cert.pem'),
    },
    app,
  );
} catch (err) {
  server = app;
}

server
  .listen(process.env.PORT)
  .on('listening', () => console.log(`Listening on port ${process.env.PORT}`))
  .on('error', console.error);

export default app;

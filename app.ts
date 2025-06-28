import * as fs from 'node:fs';
import * as https from 'node:https';
import bodyParser from 'body-parser';
import express from 'express';
import * as handlebarsExpress from 'express-handlebars';
import helmet from 'helmet';
import morgan from 'morgan';

import './db.ts';
import config from './config.ts';
import * as controller from './controller.ts';

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

let server: https.Server | express.Express;
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
} catch (_err) {
  server = app;
}

server
  .listen(config.PORT)
  .on('listening', () => console.log(`Listening on port ${config.PORT}`))
  .on('error', console.error);

export default app;

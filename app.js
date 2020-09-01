require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
require('express-async-errors');
const helmet = require('helmet');
const morgan = require('morgan');
const handlebarsExpress = require('express-handlebars');
require('./db');
const controller = require('./controller');

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        blockAllMixedContent: [],
        fontSrc: ["'self'", 'https:', 'data:'],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", 'data:', 'www.paypalobjects.com'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        upgradeInsecureRequests: [],
      },
    },
  }),
);
app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: false }));
const handlebars = handlebarsExpress.create({
  defaultLayout: false,
  extname: '.hbs',
});
app.engine('.hbs', handlebars.engine);
app.set('view engine', '.hbs');

app.get('/', controller.index);
app.post('/signup', controller.signup);
app.get('/auth/callback', controller.authCallback);
app.get('/unsubscribe/:id', controller.unsubscribe);
app.use(controller.handleError);

/* Dev HTTPS */
/*
const fs = require('fs');
const https = require('https');
const server = https.createServer(
    {
      key: fs.readFileSync('../key.pem'),
      cert: fs.readFileSync('../cert.pem'),
    },
    app,
  )
  .listen(process.env.PORT)
  .on('listening', () => console.log(`Listening on port ${process.env.PORT}`))
  .on('error', console.error);
*/

app
  .listen(process.env.PORT)
  .on('listening', () => console.log(`Listening on port ${process.env.PORT}`))
  .on('error', console.error);

module.exports = app;

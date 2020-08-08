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

app.use(helmet({
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
}));
app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: false }));
const handlebars = handlebarsExpress.create({ defaultLayout: false });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.get('/', controller.index);
app.post('/signup', controller.signup);
app.get('/auth/callback', controller.authCallback);
app.get('/unsubscribe/:id', controller.unsubscribe);
app.use(controller.handleError);

app.listen(process.env.PORT)
  .on('listening', () => console.log(`Listening on port ${process.env.PORT}`))
  .on('error', console.error);

module.exports = app;

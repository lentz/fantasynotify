require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
require('express-async-errors');
const helmet = require('helmet');
const morgan = require('morgan');
const handlebarsExpress = require('express-handlebars');
require('./db');
const User = require('./User');
const yahooAuth = require('./yahooAuth');

const app = express();

app.use(helmet());
app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: false }));
app.engine('handlebars', handlebarsExpress());
app.set('view engine', 'handlebars');

app.get('/', (req, res) => res.render('index'));

app.post('/signup', async (req, res) => {
  const email = req.body.email && req.body.email.trim();
  if (!email || !email.length) {
    return res.render('index', { errorMessage: 'Email is required!' });
  }
  const user = await User.findOne({ email }).exec();
  if (user) {
    return res.render('index', {
      errorMessage:
      `${email} is already signed up to receive notifications!`,
    });
  }
  return res.redirect(yahooAuth.code.getUri({ state: email }));
});

app.get('/auth/callback', async (req, res) => {
  if (req.query.error) { throw new Error(req.query.error); }
  const authUser = await yahooAuth.code.getToken(req.originalUrl);
  await User.create({
    email: req.query.state,
    accessToken: authUser.accessToken,
    expires: authUser.expires,
    refreshToken: authUser.refreshToken,
  });
  res.render('index', {
    successMessage:
    'All done! You\'ll start receiving transaction notifications from now on.',
  });
});

app.get('/unsubscribe/:id', async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  const context = {};
  if (!user) {
    context.errorMessage = 'No email found matching this account';
  } else {
    context.successMessage = `${user.email} has been unsubscribed`;
  }
  res.render('index', context);
});

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.render('index', { errorMessage: err.message });
});

app.listen(process.env.PORT)
  .on('listening', () => console.log(`Listening on port ${process.env.PORT}`))
  .on('error', console.error);

module.exports = app;

const mongoose = require('mongoose');

const leagues = require('./leagues');
const User = require('./User');
const yahooAuth = require('./yahooAuth');

async function index(req, res) {
  res.render('index');
}

async function signup(req, res) {
  const email = req.body.email && req.body.email.trim();
  if (!email || !email.length) {
    return res.render('index', { errorMessage: 'Email is required!' });
  }
  const user = await User.findOne({ email }).exec();
  if (user) {
    return res.render('index', {
      errorMessage: `${email} is already signed up to receive notifications!`,
    });
  }
  return res.redirect(yahooAuth.code.getUri({ state: email }));
}

async function authCallback(req, res) {
  if (req.query.error) {
    throw new Error(req.query.error);
  }
  if (!Object.keys(req.query).length) {
    return res.render('index', {
      errorMessage: 'Invalid callback, please try again.',
    });
  }
  const authUser = await yahooAuth.code.getToken(req.originalUrl);
  const user = new User({
    email: req.query.state,
    accessToken: authUser.accessToken,
    expires: authUser.expires,
    refreshToken: authUser.refreshToken,
  });
  await leagues.updateForUser(user);
  let context = {
    successMessage: `All done! You'll start receiving transaction
      notifications for ${user.leagues
        .map((league) => league.name)
        .join(', ')}.`,
  };
  if (!user.leagues.length) {
    context = {
      errorMessage: 'No fantasy football leagues found for your account!',
    };
  } else {
    await user.save();
  }
  return res.render('index', context);
}

async function unsubscribe(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.render('index', { errorMessage: 'Invalid user ID' });
  }

  const user = await User.findByIdAndDelete(req.params.id);
  const context = {};
  if (!user) {
    context.errorMessage = 'No email found matching this account';
  } else {
    context.successMessage = `${user.email} has been unsubscribed`;
  }
  return res.render('index', context);
}

function handleError(err, req, res, _next) {
  const context = { errorMessage: err.message };
  if (err.message === 'access_denied') {
    context.errorMessage = `You must click "Allow" to authorize Fantasy Notify
      to monitor your league's transactions.`;
  } else {
    console.error(err.stack);
  }
  res.render('index', context);
}

module.exports = {
  authCallback,
  handleError,
  index,
  signup,
  unsubscribe,
};

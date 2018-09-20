require('dotenv').config();
const axios = require('axios');
const express = require('express');
require('express-async-errors');
const morgan = require('morgan');
const ClientOAuth2 = require('client-oauth2')

const app = express();

app.use(morgan('combined'));

const yahooAuth = new ClientOAuth2({
  clientId: process.env.YAHOO_CLIENT_ID,
  clientSecret: process.env.YAHOO_CLIENT_SECRET,
  accessTokenUri: 'https://api.login.yahoo.com/oauth2/get_token',
  authorizationUri: 'https://api.login.yahoo.com/oauth2/request_auth',
  redirectUri: `${process.env.DOMAIN}/auth/callback`,
  scopes: ['fspt-r'],
});

app.get('/', (req, res) => {
  res.redirect(yahooAuth.code.getUri());
});

app.get('/auth/callback', async (req, res) => {
  const authUser = await yahooAuth.code.getToken(req.originalUrl);
  try {
    const usersRes = await axios.get(
      'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_codes=nfl;is_available=1/leagues?format=json',
      authUser.sign({}),
      // { headers: { Authorization: `Bearer ${process.env.AUTH_TOKEN}` } },
    );

    const yahooLeagues = usersRes.data.fantasy_content.users[0]
      .user[1].games[0].game[1].leagues;
    const leagueData = Object.entries(yahooLeagues)
      .filter(entry => entry[1].league)
      .map(entry => entry[1].league[0])
      .map(league => ({ league_key: league.league_key, name: league.name }))
    res.json(leagueData);
  } catch (err) {
    if (err.response) {
      console.error(err.response.status, err.response.data);
    } else {
      console.log(err);
    }
  }

  // Refresh the current users access token.
  // user.refresh().then(function (updatedUser) {
  //   console.log(updatedUser !== user) //=> true
  //   console.log(updatedUser.accessToken)
  // })
});

app.listen(process.env.PORT)
  .on('listening', () => console.log(`Listening on port ${process.env.PORT}`))
  .on('error', console.error);

module.exports = app;

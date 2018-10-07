const axios = require('axios');

async function updateForUser(user, httpLib = axios) {
  const usersRes = await httpLib.get(
    'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_codes=nfl;is_available=1/leagues?format=json',
    { headers: { Authorization: `Bearer ${user.accessToken}` } },
  );

  const yahooLeagues = usersRes.data.fantasy_content.users[0]
    .user[1].games[0].game[1].leagues;

  const leagues = Object.entries(yahooLeagues)
    .filter(entry => entry[1].league)
    .map(entry => entry[1].league[0])
    .map(league => ({ key: league.league_key, name: league.name }));

  leagues.forEach((league) => {
    if (!(user.leagues || []).find(uL => uL.key === league.key)) {
      user.leagues.push(league);
    }
  });
}

module.exports = { updateForUser };

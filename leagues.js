const got = require('got');

async function updateForUser(user, httpLib = got) {
  const users = await httpLib(
    'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_codes=nfl;is_available=1/leagues?format=json',
    { headers: { Authorization: `Bearer ${user.accessToken}` } },
  ).json();

  const { games } = users.fantasy_content.users[0].user[1];
  if (!Object.keys(games).length) {
    return;
  }
  const yahooLeagues = games[0].game[1].leagues;

  const leagues = Object.entries(yahooLeagues)
    .filter((entry) => entry[1].league)
    .map((entry) => entry[1].league[0])
    .map((league) => ({ key: league.league_key, name: league.name }));

  leagues.forEach((league) => {
    if (!(user.leagues || []).some((uL) => uL.key === league.key)) {
      user.leagues.push(league);
    }
  });

  user.leagues = (user.leagues || []).filter((existingLeague) => {
    return leagues.some((league) => league.key === existingLeague.key);
  });
}

module.exports = { updateForUser };

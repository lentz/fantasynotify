import got from 'got';

export async function update(user: any, httpLib = got) {
  const users: any = await httpLib(
    'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_codes=nfl;is_available=1/leagues?format=json',
    { headers: { Authorization: `Bearer ${user.accessToken}` } },
  ).json();

  const { games } = users.fantasy_content.users[0].user[1];
  if (!Object.keys(games).length) {
    return;
  }
  const yahooLeagues = games[0].game[1].leagues;

  const leagues: any[] = Object.entries(yahooLeagues)
    .filter((entry: any) => entry[1].league)
    .map((entry: any) => entry[1].league[0])
    .map((league) => ({ key: league.league_key, name: league.name }));

  leagues.forEach((league) => {
    if (!(user.leagues || []).some((uL: any) => uL.key === league.key)) {
      user.leagues.push(league);
    }
  });

  user.leagues = (user.leagues || []).filter((existingLeague: any) =>
    leagues.some((league) => league.key === existingLeague.key),
  );
}

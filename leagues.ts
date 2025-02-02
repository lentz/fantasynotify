import type { IUser } from './User.ts';

interface IYahooLeague {
  league: [
    {
      league_key: string;
      name: string;
    },
  ];
}

interface IYahooGame {
  game: [
    {
      game_id: string;
    },
    {
      leagues: {
        [leagueIndex: string]: IYahooLeague;
      };
    },
  ];
}

interface IYahooResponse {
  fantasy_content: {
    users: {
      [userIndex: string]: {
        user: [
          {
            guid: string;
          },
          {
            games: {
              [gameIndex: string]: IYahooGame;
            };
          },
        ];
      };
    };
  };
}

export async function update(user: IUser, httpLib: typeof fetch = fetch) {
  const response = await httpLib(
    'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_codes=nfl;is_available=1/leagues?format=json',
    { headers: { Authorization: `Bearer ${user.accessToken}` } },
  );

  if (!response.ok) {
    if ([401, 403].includes(response.status)) {
      const body = await response.json();
      console.warn(
        `Users auth failure with HTTP ${response.status}: ${JSON.stringify(body.error, null, 2)}`,
      );

      return;
    } else {
      throw new Error(
        `Users request failed with HTTP ${response.status}: ${await response.text()}`,
      );
    }
  }

  const users: IYahooResponse = await response.json();

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

  user.leagues = (user.leagues || []).filter((existingLeague) =>
    leagues.some((league) => league.key === existingLeague.key),
  );
}

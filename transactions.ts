import type { ILeague, IUser } from './User.ts';

function mapPlayers(players: IYahooPlayers): IPlayer[] {
  return Object.entries(players)
    .map((entry) => entry[1].player)
    .filter((entry) => entry)
    .map((playerTrans) => {
      let transactionData = playerTrans[1].transaction_data;
      if (Array.isArray(transactionData)) {
        [transactionData] = transactionData;
      }
      return {
        ...transactionData,
        name: playerTrans[0][2].name.full,
      };
    });
}

interface IYahooTransactionData {
  destination_team_name: string;
  destination_type: 'team' | 'waivers';
  source_team_name: string;
  source_type: 'freeagents' | 'team' | 'waivers';
  type: 'add' | 'drop';
}

interface IYahooPlayers {
  [playerNumber: string]: {
    player: [
      [
        { player_key: string },
        { player_id: string },
        { name: { full: string } },
      ],
      {
        transaction_data: IYahooTransactionData | IYahooTransactionData[];
      },
    ];
  };
}

interface IYahooTransaction {
  transaction: [
    {
      faab_bid: number;
      status: string;
      transaction_key: string;
    },
    {
      players: IYahooPlayers;
    },
  ];
}

interface IYahooResponse {
  fantasy_content: {
    league: {
      transactions: {
        [transactionNumber: string]: IYahooTransaction;
      };
    }[];
  };
}

export interface IPlayer extends IYahooTransactionData {
  name: string;
}

export interface ITransaction {
  key: string;
  bid: number;
  players: IPlayer[];
}

export async function getAll(
  league: ILeague,
  user: IUser,
  httpLib: typeof fetch = fetch,
): Promise<ITransaction[]> {
  const response = await httpLib(
    `https://fantasysports.yahooapis.com/fantasy/v2/league/${league.key}/transactions;types=add,drop?format=json`,
    { headers: { Authorization: `Bearer ${user.accessToken}` } },
  );

  if (!response.ok) {
    if ([401, 403].includes(response.status)) {
      const body = await response.json();
      console.warn(
        `Transactions auth failure with HTTP ${response.status}: ${JSON.stringify(body.error, null, 2)}`,
      );

      return [];
    } else {
      throw new Error(
        `Transactions request failed with HTTP ${response.status}: ${await response.text()}`,
      );
    }
  }

  const responseBody: IYahooResponse = await response.json();

  return Object.entries(responseBody.fantasy_content.league[1].transactions)
    .map((entry) => entry[1].transaction)
    .filter((transaction) => transaction)
    .filter((transaction) => transaction[0].status === 'successful')
    .map((transaction) => ({
      bid: transaction[0].faab_bid,
      key: transaction[0].transaction_key,
      players: mapPlayers(transaction[1].players),
    }));
}

export function filterNew(league: ILeague, transactions: ITransaction[] = []) {
  if (!league.lastNotifiedTransaction) {
    return transactions;
  }
  const lastNotifiedTransactionIndex = transactions.findIndex(
    (transaction) => transaction.key === league.lastNotifiedTransaction,
  );

  return transactions.slice(0, lastNotifiedTransactionIndex);
}

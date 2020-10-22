const got = require('got');

function mapPlayers(players) {
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

async function getAll(league, user, httpLib = got) {
  const transactions = await httpLib(
    `https://fantasysports.yahooapis.com/fantasy/v2/league/${league.key}/transactions;types=add,drop?format=json`,
    { headers: { Authorization: `Bearer ${user.accessToken}` } },
  ).json();
  const yahooTransactions = transactions.fantasy_content.league[1].transactions;

  return Object.entries(yahooTransactions)
    .map((entry) => entry[1].transaction)
    .filter((transaction) => transaction)
    .filter((transaction) => transaction[0].status === 'successful')
    .map((transaction) => ({
      bid: transaction[0].faab_bid,
      key: transaction[0].transaction_key,
      players: mapPlayers(transaction[1].players),
    }));
}

function filterNew(league, transactions = []) {
  if (!league.lastNotifiedTransaction) {
    return transactions;
  }
  const lastNotifiedTransactionIndex = transactions.findIndex(
    (transaction) => transaction.key === league.lastNotifiedTransaction,
  );

  return transactions.slice(0, lastNotifiedTransactionIndex);
}

module.exports = { filterNew, getAll };

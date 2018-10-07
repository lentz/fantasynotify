#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');
const Notification = require('./Notification');
const User = require('./User');
require('./db');
const yahooAuth = require('./yahooAuth');

/* eslint-disable no-param-reassign */
async function renewToken(user) {
  const token = yahooAuth.createToken(user.accessToken, user.refreshToken, 'bearer');
  const newToken = await token.refresh();
  user.accessToken = newToken.accessToken;
  user.expires = newToken.expires;
  return user;
}
/* eslint-enable no-param-reassign */

async function updateLeagues(user) {
  const usersRes = await axios.get(
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

function mapPlayers(players) {
  return Object.entries(players)
    .map(entry => entry[1].player)
    .filter(entry => entry)
    .map((playerTrans) => {
      let transactionData = playerTrans[1].transaction_data;
      if (Array.isArray(transactionData)) { [transactionData] = transactionData; }
      return {
        ...transactionData,
        name: playerTrans[0][2].name.full,
      };
    });
}

async function getTransactions(league, user) {
  const transactionsRes = await axios.get(
    `https://fantasysports.yahooapis.com/fantasy/v2/league/${league.key}/transactions;types=add,drop?format=json`,
    { headers: { Authorization: `Bearer ${user.accessToken}` } },
  );
  const yahooTransactions = transactionsRes.data.fantasy_content.league[1].transactions;
  if (process.env.LOG_TRANSACTIONS) { console.log(JSON.stringify(yahooTransactions, null, 2)); }
  return Object.entries(yahooTransactions)
    .map(entry => entry[1].transaction)
    .filter(transaction => transaction)
    .filter(transaction => transaction[0].status === 'successful')
    .map(transaction => ({
      bid: transaction[0].faab_bid,
      key: transaction[0].transaction_key,
      players: mapPlayers(transaction[1].players),
    }));
}

function newTransactions(league, transactions) {
  if (!league.lastNotifiedTransaction) { return []; }
  const lastNotifiedTransactionIndex = transactions
    .findIndex(transaction => transaction.key === league.lastNotifiedTransaction);

  return transactions.slice(0, lastNotifiedTransactionIndex);
}

/* eslint-disable no-await-in-loop */
async function run() {
  try {
    const users = await User.find().exec();
    for (const user of users) { // eslint-disable-line no-restricted-syntax
      const notification = new Notification(user);
      if (user.expires < new Date()) { await renewToken(user); }
      await updateLeagues(user);
      for (const league of user.leagues) { // eslint-disable-line no-restricted-syntax
        const transactions = await getTransactions(league, user);
        notification.addTransactions(league, newTransactions(league, transactions));
        league.lastNotifiedTransaction = transactions && transactions[0].key;
      }
      await notification.send();
      await user.save();
    }
    process.exit();
  } catch (err) {
    console.error(err.stack);
    process.exit(1);
  }
}
/* eslint-enable no-await-in-loop */

run();

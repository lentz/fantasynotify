#!/usr/bin/env node

const axios = require('axios');
const User = require('./User');
require('./db');
const yahooAuth = require('./yahooAuth');

async function renewToken(user) {
  const token = yahooAuth.createToken(user.accessToken, user.refreshToken, 'bearer');
  const newToken = await token.refresh();

  return User.findOneAndUpdate(
    {
      email: user.email,
    },
    {
      accessToken: newToken.accessToken,
      refreshToken: newToken.refreshToken,
      expires: newToken.expires,
    },
    {
      new: true,
    }
  ).exec();
}

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

  leagues.forEach(league => {
    if(!(user.leagues || []).find(uL => uL.key === league.key)) {
      user.leagues.push(league);
    }
  });
}

function mapPlayers(players) {
  return Object.entries(players)
    .map(entry => entry[1].player)
    .filter(entry => entry)
    .map(playerTrans => {
      let transactionData = playerTrans[1].transaction_data;
      if (Array.isArray(transactionData)) { transactionData = transactionData[0]; }
      return {
        ...transactionData,
        name: playerTrans[0][2].name.full,
      }
    });
}

async function getTransactions(league, user) {
  const transactionsRes = await axios.get(
    `https://fantasysports.yahooapis.com/fantasy/v2/league/${league.key}/transactions;types=add,drop?format=json`,
    { headers: { Authorization: `Bearer ${user.accessToken}` } },
  );
  const yahooTransactions = transactionsRes.data.fantasy_content.league[1].transactions;
  return Object.entries(yahooTransactions)
    .map(entry => entry[1].transaction)
    .filter(transaction => transaction)
    .filter(transaction => transaction[0].status === 'successful')
    .map(transaction => ({
      key: transaction[0].transaction_key,
      players: mapPlayers(transaction[1].players),
    }));
}

async function sendNotifications(transactions, league) {
  console.log('send notifications since', league.lastNotifiedTransaction);
}

async function run() {
  try {
    const users = await User.find().exec();
    for (let user of users) {
      if (user.expires < new Date()) {
        user = await renewToken(user);
      }
      await updateLeagues(user);
      for (const league of user.leagues) {
        const transactions = await getTransactions(league, user);
        const latestTransaction = transactions && transactions[0].key;
        if (league.lastNotifiedTransaction && league.lastNotifiedTransaction !== latestTransaction) {
          await sendNotifications(transactions, league);
        }
        league.lastNotifiedTransaction = latestTransaction;
      }
      await User.updateOne({ email: user.email }, { leagues: user.leagues }).exec();
    }
    process.exit();
  } catch (err) {
    console.error(require('util').inspect(err, { depth: null }));
    process.exit(1);
  }
}

run();

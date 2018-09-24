#!/usr/bin/env node

const axios = require('axios');
const { readFileSync } = require('fs');
const handlebars = require('handlebars');
const sgMail = require('@sendgrid/mail');
const User = require('./User');
require('./db');
const yahooAuth = require('./yahooAuth');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const emailTemplate = handlebars.compile(
  readFileSync('./views/emailLayout.handlebars').toString(),
);

const leagueTemplate = handlebars.compile(
  readFileSync('./views/league.handlebars').toString(),
);

handlebars.registerHelper('playerTransaction', function(player) {
  let source = '';
  let action;
  let team;
  if (player.type === 'add') {
    action = 'added';
    team = player.destination_team_name;
    if (player.source_type === 'waivers') {
      source = 'from waivers';
    } else if (player.source_type === 'freeagents') {
      source = 'from free agents';
    }
  } else {
    action = 'dropped';
    team = player.source_team_name;
  }
  return `${team} ${action} ${player.name} ${source}`;
});

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

function renderTransactions(transactions, league) {
  const lastNotifiedTransactionIndex = transactions.findIndex(transaction => {
    return transaction.key === league.lastNotifiedTransaction;
  });
  return leagueTemplate({
    transactions: transactions.slice(0, lastNotifiedTransactionIndex),
    league,
  });
}

async function run() {
  try {
    let emailContent = '';
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
          emailContent += renderTransactions(transactions, league);
        }
        league.lastNotifiedTransaction = latestTransaction;
      }
      if (emailContent.length) {
        console.log('Sending email to', user.email);
        await sgMail.send({
          to: user.email,
          from: 'Fantasy Notify <notifications@fantasynotify.herokuapp.net>',
          subject: 'New transactions in your NFL fantasy league',
          html: emailTemplate({
            body: emailContent,
            domain: process.env.DOMAIN,
            user,
          }),
        });
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

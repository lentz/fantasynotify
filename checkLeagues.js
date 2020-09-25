#!/usr/bin/env node

require('dotenv').config();
const db = require('./db');
const Notification = require('./Notification');
const leagues = require('./leagues');
const transactions = require('./transactions');
const User = require('./User');

/* eslint-disable no-await-in-loop */
(async function run() {
  const users = await User.find().sort({ updatedAt: 1 }).exec();
  // eslint-disable-next-line no-restricted-syntax
  for (const user of users) {
    try {
      console.log(`Checking leagues for ${user.email}`);
      const notification = new Notification(user);
      if (user.expires < new Date()) {
        await user.renewToken();
      }
      await leagues.updateForUser(user);
      // eslint-disable-next-line no-restricted-syntax
      for (const league of user.leagues) {
        const allTransactions = await transactions.getAll(league, user);
        notification.addTransactions(
          league,
          transactions.filterNew(league, allTransactions),
        );
        if (allTransactions && allTransactions.length) {
          league.lastNotifiedTransaction = allTransactions[0].key;
        }
      }
      await notification.send();
      user.markModified('leagues');
      await user.save();
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      if (err.response) {
        console.error(`HTTP ${err.response.status}: ${err.response.data}`);
      }
      console.error(err.stack);
      if (err.body && err.body.error === 'INVALID_REFRESH_TOKEN') {
        console.log(`Deleting user '${user.email}' with invalid refresh token`);
        await user.remove();
      }
    }
  }
  db.close();
})();
/* eslint-enable no-await-in-loop */

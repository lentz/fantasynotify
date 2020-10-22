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
      await user.renewToken();
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
      if (err.body && err.body.error === 'INVALID_REFRESH_TOKEN') {
        console.log(`Deleting user '${user.email}' with revoked refresh token`);
        await user.remove();
      } else if (err.code) {
        console.error(
          `HTTP ${err.code}: ${JSON.stringify(
            err.body,
            null,
            2,
          )}`,
        );
      } else {
        console.error(err.stack);
      }
    }
  }
  db.close();
})();
/* eslint-enable no-await-in-loop */

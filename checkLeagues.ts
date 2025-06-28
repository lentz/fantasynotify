#!/usr/bin/env node

import db from './db.ts';
import * as leagues from './leagues.ts';
import Notification from './Notification.ts';
import * as transactions from './transactions.ts';
import User from './User.ts';

const users = await User.find().sort({ updatedAt: 1 }).exec();

for (const user of users) {
  try {
    console.log(`Checking leagues for ${user.email}`);
    const notification = new Notification(user);
    await user.renewToken();
    await leagues.update(user);
    for (const league of user.leagues ?? []) {
      const allTransactions = await transactions.getAll(league, user);
      notification.addTransactions(
        league,
        transactions.filterNew(league, allTransactions),
      );
      if (allTransactions?.length) {
        league.lastNotifiedTransaction = allTransactions[0].key;
      }
    }
    await notification.send();
    user.markModified('leagues');
    await user.save();
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
    // biome-ignore lint/suspicious/noExplicitAny: Always an Error
  } catch (err: any) {
    if (err.body?.error === 'INVALID_REFRESH_TOKEN') {
      console.log(`Deleting user '${user.email}' with revoked refresh token`);
      await user.deleteOne();
    } else if (err.code) {
      console.error(`HTTP ${err.code}: ${JSON.stringify(err.body, null, 2)}`);
    } else {
      console.error((err as Error).stack);
    }
  }
}
db.close();

import { equal } from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

mock.module('./config.ts', {
  defaultExport: { SENDGRID_API_KEY: 'SG.TESTKEY' },
});

const { default: Notification } = await import('./Notification.ts');
import type { ILeague, IUser } from './User.ts';

describe('Notification', () => {
  const mockUser = { id: '123', email: 'test@test.com' };
  const mockLeague = { name: 'Test League' };
  const mockMailer = { send: mock.fn() };

  afterEach(() => {
    mockMailer.send.mock.resetCalls();
  });

  describe('#send', () => {
    it('does not send a notification if there are no transactions', () => {
      const notification = new Notification(
        mockUser as IUser,
        mockMailer as any,
      );

      notification.send();

      equal(mockMailer.send.mock.callCount(), 0);
    });
  });

  describe('#addTransactions', () => {
    it('renders the transactions when calling send', (t) => {
      const notification = new Notification(
        mockUser as IUser,
        mockMailer as any,
      );
      const mockTransactions = [
        {
          players: [
            {
              destination_team_name: 'Test Team 1',
              name: 'Carson Wentz',
              source_type: 'waivers',
              type: 'add',
            },
            {
              name: 'Alex Smith',
              source_team_name: 'Test Team 1',
              type: 'drop',
            },
          ],
        },
        {
          bid: 7,
          players: [
            {
              destination_team_name: 'Test Team 2',
              name: 'Zach Ertz',
              source_type: 'waivers',
              type: 'add',
            },
            {
              name: 'Jordan Reed',
              source_team_name: 'Test Team 2',
              type: 'drop',
            },
          ],
        },
        {
          players: [
            {
              destination_team_name: 'Test Team 3',
              name: 'Jay Ajayi',
              source_type: 'freeagents',
              type: 'add',
            },
            {
              name: 'James Connor',
              source_team_name: 'Test Team 3',
              type: 'drop',
            },
          ],
        },
        {
          players: [
            {
              name: 'Antonio Brown',
              source_team_name: 'Test Team 4',
              type: 'drop',
            },
          ],
        },
      ];

      notification.addTransactions(
        mockLeague as ILeague,
        mockTransactions as any,
      );

      notification.send();

      const mailerArg = mockMailer.send.mock.calls[0].arguments[0];
      equal(mailerArg.from, 'Fantasy Notify <fantasynotify@buddyduel.net>');
      equal(mailerArg.to, 'test@test.com');
      equal(mailerArg.subject, 'New transactions in Test League');
      t.assert.snapshot(mailerArg.html);
    });

    it('creates message with transactions from multiple leagues', (t) => {
      const notification = new Notification(
        mockUser as IUser,
        mockMailer as any,
      );

      const mockLeague1Transactions = [
        {
          players: [
            {
              destination_team_name: 'Test Team 1',
              name: 'Carson Wentz',
              source_type: 'waivers',
              type: 'add',
            },
            {
              name: 'Alex Smith',
              source_team_name: 'Test Team 1',
              type: 'drop',
            },
          ],
        },
      ];
      notification.addTransactions(
        mockLeague as ILeague,
        mockLeague1Transactions as any[],
      );

      const mockLeague2Transactions = [
        {
          players: [
            {
              destination_team_name: 'Test Team 2',
              name: 'Zach Ertz',
              source_type: 'waivers',
              type: 'add',
            },
            {
              name: 'Jordan Reed',
              source_team_name: 'Test Team 2',
              type: 'drop',
            },
          ],
        },
      ];
      notification.addTransactions(
        { name: 'League 2' } as ILeague,
        mockLeague2Transactions as any[],
      );

      notification.send();

      const mailerArg = mockMailer.send.mock.calls[0].arguments[0];
      equal(mailerArg.subject, 'New transactions in Test League, League 2');
      t.assert.snapshot(mailerArg.html);
    });
  });
});

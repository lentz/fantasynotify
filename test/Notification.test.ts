import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';

import Notification from '../Notification.ts';

describe('notification', () => {
  const mockUser = { id: '123', email: 'test@test.com' };
  const mockLeague = { name: 'Test League' };
  it('does not send a notification if addTransaction is not called', () => {
    const mockMailer = { send: mock.fn() };
    const notification = new Notification(mockUser, mockMailer);

    notification.send();

    assert.equal(mockMailer.send.mock.callCount(), 0);
  });

  it('does not send a notification if empty transactions are provided', () => {
    const mockMailer = { send: mock.fn() };
    const notification = new Notification(mockUser, mockMailer);
    notification.addTransactions(mockLeague, []);
    notification.addTransactions(mockLeague);

    notification.send();

    assert.equal(mockMailer.send.mock.callCount(), 0);
  });

  it('renders the transactions when calling send', (t) => {
    const mockMailer = { send: mock.fn() };
    const notification = new Notification(mockUser, mockMailer);
    mock.method(console, 'log', () => {});
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

    notification.addTransactions(mockLeague, mockTransactions);

    notification.send();

    const mailerArg = mockMailer.send.mock.calls[0].arguments[0];
    assert.equal(
      mailerArg.from,
      'Fantasy Notify <fantasynotify@buddyduel.net>',
    );
    assert.equal(mailerArg.to, 'test@test.com');
    assert.equal(mailerArg.subject, 'New transactions in Test League');
    t.assert.snapshot(mailerArg.html.split('\n'));
  });

  it('creates message with transactions from multiple leagues', (t) => {
    const mockMailer = { send: mock.fn() };
    const notification = new Notification(mockUser, mockMailer);
    mock.method(console, 'log', () => {});
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
    notification.addTransactions(mockLeague, mockLeague1Transactions);
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
    notification.addTransactions({ name: 'League 2' }, mockLeague2Transactions);

    notification.send();

    const mailerArg = mockMailer.send.mock.calls[0].arguments[0];
    assert.equal(
      mailerArg.subject,
      'New transactions in Test League, League 2',
    );
    t.assert.snapshot(mailerArg.html.split('\n'));
  });
});

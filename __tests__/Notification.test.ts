import { describe, expect, it, vi } from 'vitest';

vi.mock('../config.ts', () => ({
  default: { SENDGRID_API_KEY: 'SG.TESTKEY' },
}));

import Notification from '../Notification.ts';

describe('notification', () => {
  const mockUser = { id: '123', email: 'test@test.com' };
  const mockLeague = { name: 'Test League' };
  const mockMailer = { send: vi.fn() };

  it('does not send a notification if addTransaction is not called', () => {
    const notification = new Notification(mockUser, mockMailer);

    notification.send();

    expect(mockMailer.send).not.toHaveBeenCalled();
  });

  it('does not send a notification if empty transactions are provided', () => {
    const notification = new Notification(mockUser, mockMailer);
    notification.addTransactions(mockLeague, []);
    notification.addTransactions(mockLeague);

    notification.send();

    expect(mockMailer.send).not.toHaveBeenCalled();
  });

  it('renders the transactions when calling send', () => {
    const notification = new Notification(mockUser, mockMailer);
    vi.spyOn(console, 'log').mockReturnValue();
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

    const mailerArg = mockMailer.send.mock.calls[0][0];
    expect(mailerArg.from).toBe('Fantasy Notify <fantasynotify@buddyduel.net>');
    expect(mailerArg.to).toBe('test@test.com');
    expect(mailerArg.subject).toBe('New transactions in Test League');
    expect(mailerArg.html).toMatchSnapshot();
  });

  it('creates message with transactions from multiple leagues', () => {
    const notification = new Notification(mockUser, mockMailer);
    vi.spyOn(console, 'log').mockReturnValue();
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

    const mailerArg = mockMailer.send.mock.calls[0][0];
    expect(mailerArg.subject).toBe('New transactions in Test League, League 2');
    expect(mailerArg.html).toMatchSnapshot();
  });
});

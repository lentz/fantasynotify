import { deepEqual } from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { filterNew, getAll, type ITransaction } from './transactions.ts';
import type { ILeague, IUser } from './User.ts';

describe('transactions', () => {
  const mockLeague = {
    key: 'fake-key',
    name: 'league',
    lastNotifiedTransaction: '2',
  };
  const mockYahooTransactions = readFileSync(
    './test-data/mockYahooTransactions.json',
    'utf8',
  );

  describe('#getAll', () => {
    it('tranforms yahoo response into usable transactions', async () => {
      const mockHttpLib = () =>
        Promise.resolve({
          json: () => Promise.resolve(JSON.parse(mockYahooTransactions)),
          ok: true,
        });

      const transactions = await getAll(
        mockLeague,
        {} as IUser,
        mockHttpLib as any,
      );

      deepEqual(transactions, [
        {
          bid: 7,
          key: '380.l.241704.tr.146',
          players: [
            {
              destination_team_key: '380.l.241704.t.7',
              destination_team_name: "Zeke's Freaks",
              destination_type: 'team',
              name: 'Wendell Smallwood',
              source_type: 'waivers',
              type: 'add',
            },
            {
              destination_type: 'waivers',
              name: 'Ted Ginn Jr.',
              source_team_key: '380.l.241704.t.7',
              source_team_name: "Zeke's Freaks",
              source_type: 'team',
              type: 'drop',
            },
          ],
        },
        {
          bid: undefined,
          key: '380.l.241704.tr.145',
          players: [
            {
              destination_team_key: '380.l.241704.t.6',
              destination_team_name: '2017 Third Place',
              destination_type: 'team',
              name: 'Graham Gano',
              source_type: 'freeagents',
              type: 'add',
            },
            {
              destination_type: 'waivers',
              name: 'Marquez Valdes-Scantling',
              source_team_key: '380.l.241704.t.6',
              source_team_name: '2017 Third Place',
              source_type: 'team',
              type: 'drop',
            },
          ],
        },
        {
          bid: undefined,
          key: '380.l.241704.tr.144',
          players: [
            {
              destination_team_key: '380.l.241704.t.1',
              destination_team_name: 'Chris Hogan BROTHER',
              destination_type: 'team',
              name: "D'Onta Foreman",
              source_type: 'freeagents',
              type: 'add',
            },
            {
              destination_type: 'waivers',
              name: 'Tyler Eifert',
              source_team_key: '380.l.241704.t.1',
              source_team_name: 'Chris Hogan BROTHER',
              source_type: 'team',
              type: 'drop',
            },
          ],
        },
        {
          bid: undefined,
          key: '380.l.241704.tr.143',
          players: [
            {
              destination_team_key: '380.l.241704.t.11',
              destination_team_name: '2018 Champion',
              destination_type: 'team',
              name: 'Ricky Seals-Jones',
              source_type: 'freeagents',
              type: 'add',
            },
            {
              destination_type: 'waivers',
              name: 'Will Dissly',
              source_team_key: '380.l.241704.t.11',
              source_team_name: '2018 Champion',
              source_type: 'team',
              type: 'drop',
            },
          ],
        },
      ]);
    });
  });

  describe('#filterNew', () => {
    it('returns only new transactions', () => {
      const transactions = [
        { key: '3' },
        { key: '2' },
        { key: '1' },
      ] as ITransaction[];

      const newTransactions = filterNew(mockLeague, transactions);

      deepEqual(newTransactions, [{ key: '3' }]);
    });

    it('returns empty array if none are new', () => {
      const transactions = [{ key: '2' }, { key: '1' }] as ITransaction[];

      const newTransactions = filterNew(mockLeague, transactions);

      deepEqual(newTransactions, []);
    });

    it('returns empty array if transactions is not provided', () => {
      deepEqual(filterNew({ name: 'new' } as ILeague), []);
    });

    it('returns all transactions if the league does not have a last modified transaction', () => {
      deepEqual(
        filterNew({ key: 'fake-key', name: 'new' }, [
          { key: '1' },
        ] as ITransaction[]),
        [{ key: '1' }],
      );
    });
  });
});

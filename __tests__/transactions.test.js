const { readFileSync } = require('fs');
const { filterNew, getAll } = require('../transactions');

describe('transactions', () => {
  beforeEach(() => expect.hasAssertions());
  afterEach(() => jest.resetAllMocks());

  const mockLeague = { name: 'league', lastNotifiedTransaction: '2' };
  const mockYahooTransactions = readFileSync('./__tests__/mockYahooTransactions.json');

  describe('#getAll', () => {
    test('tranforms yahoo response into usable transactions', async () => {
      const mockHttpLib = {
        get: () => Promise.resolve(JSON.parse(mockYahooTransactions)),
      };

      const transactions = await getAll(mockLeague, {}, mockHttpLib);

      expect(transactions).toEqual([
        {
          bid: 7,
          key: '380.l.241704.tr.146',
          players:  [
            {
              destination_team_key: '380.l.241704.t.7',
              destination_team_name: 'Zeke\'s Freaks',
              destination_type: 'team',
              name: 'Wendell Smallwood',
              source_type: 'waivers',
              type: 'add',
            },
            {
              destination_type: 'waivers',
              name: 'Ted Ginn Jr.',
              source_team_key: '380.l.241704.t.7',
              source_team_name: 'Zeke\'s Freaks',
              source_type: 'team',
              type: 'drop',
            },
          ],
        },
        {
          bid: undefined,
          key: '380.l.241704.tr.145',
          players:  [
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
          players:  [
            {
              destination_team_key: '380.l.241704.t.1',
              destination_team_name: 'Chris Hogan BROTHER',
              destination_type: 'team',
              name: 'D\'Onta Foreman',
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
          players:  [
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
    test('returns only new transactions', () => {
      const transactions = [
        { key: '3' },
        { key: '2' },
        { key: '1' },
      ];

      const newTransactions = filterNew(mockLeague, transactions);

      expect(newTransactions).toEqual([{ key: '3' }]);
    });

    test('returns empty array if none are new', () => {
      const transactions = [
        { key: '2' },
        { key: '1' },
      ];

      const newTransactions = filterNew(mockLeague, transactions);

      expect(newTransactions).toEqual([]);
    });

    test('returns empty array if the league does not have a last modified transaction', () => {
      expect(filterNew({ name: 'new' })).toEqual([]);
      expect(filterNew({ name: 'new' }, [{ key: '1' }])).toEqual([]);
    });
  });
});
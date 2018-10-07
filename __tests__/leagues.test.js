const { readFileSync } = require('fs');
const { updateForUser } = require('../leagues');

describe('leagues', () => {
  const mockYahooUser = readFileSync('./__tests__/mockYahooUser.json');

  describe('#updateForUser', () => {
    test('adds new leagues to the user', async () => {
      const mockHttpLib = {
        get: () => Promise.resolve(JSON.parse(mockYahooUser)),
      };
      const mockUser = { leagues: [] };

      await updateForUser(mockUser, mockHttpLib);

      expect(mockUser.leagues).toEqual([
        {
          key: '380.l.942166',
          name: 'Keeper League',
        },
        {
          key: '380.l.511310',
          name: 'Belmont St Fantasy',
        },
      ]);
    });

    test('only adds leagues that are not already present', async () => {
      const mockHttpLib = {
        get: () => Promise.resolve(JSON.parse(mockYahooUser)),
      };
      const mockUser = {
        leagues: [
          {
            key: '380.l.942166',
            name: 'Keeper League',
          },
        ],
      };

      await updateForUser(mockUser, mockHttpLib);

      expect(mockUser.leagues).toEqual([
        {
          key: '380.l.942166',
          name: 'Keeper League',
        },
        {
          key: '380.l.511310',
          name: 'Belmont St Fantasy',
        },
      ]);
    });

    test('does not modify leagues if they all already exist', async () => {
      const mockHttpLib = {
        get: () => Promise.resolve(JSON.parse(mockYahooUser)),
      };
      const mockUser = {
        leagues: [
          {
            key: '380.l.942166',
            name: 'Keeper League',
          },
          {
            key: '380.l.511310',
            name: 'Belmont St Fantasy',
          },
        ],
      };

      await updateForUser(mockUser, mockHttpLib);

      expect(mockUser.leagues).toEqual([
        {
          key: '380.l.942166',
          name: 'Keeper League',
        },
        {
          key: '380.l.511310',
          name: 'Belmont St Fantasy',
        },
      ]);
    });
  });
});

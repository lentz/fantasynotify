import { readFileSync } from 'fs';

import { describe, expect, test } from 'vitest';

import * as leagues from '../leagues.js';

describe('leagues', () => {
  const mockYahooUser = readFileSync('./__tests__/mockYahooUser.json');

  describe('#update', () => {
    test('adds new leagues to the user', async () => {
      const mockHttpLib = () => ({
        json: () => Promise.resolve(JSON.parse(mockYahooUser)),
      });
      const mockUser = { leagues: [] };

      await leagues.update(mockUser, mockHttpLib);

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
      const mockHttpLib = () => ({
        json: () => Promise.resolve(JSON.parse(mockYahooUser)),
      });
      const mockUser = {
        leagues: [
          {
            key: '380.l.942166',
            name: 'Keeper League',
          },
        ],
      };

      await leagues.update(mockUser, mockHttpLib);

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
      const mockHttpLib = () => ({
        json: () => Promise.resolve(JSON.parse(mockYahooUser)),
      });
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

      await leagues.update(mockUser, mockHttpLib);

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

    test('removes old leagues that are no longer returned from Yahoo', async () => {
      const mockHttpLib = () => ({
        json: () => Promise.resolve(JSON.parse(mockYahooUser)),
      });
      const mockUser = {
        leagues: [
          {
            key: '300.l.123456',
            name: 'Old League',
          },
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

      await leagues.update(mockUser, mockHttpLib);

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

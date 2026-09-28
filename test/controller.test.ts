import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import User from '../User.ts';
import yahooAuth from '../yahooAuth.ts';

const updateLeagues = mock.fn();
mock.module('../leagues.ts', {
  exports: { update: updateLeagues },
});

const controller = await import('../controller.ts');

describe('controller', () => {
  const mockRes = {
    render: mock.fn(),
    redirect: mock.fn(),
  };

  beforeEach(() => {
    mockRes.render.mock.resetCalls();
    mockRes.redirect.mock.resetCalls();
    updateLeagues.mock.resetCalls();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe('#index', () => {
    it('renders the home page', () => {
      controller.index({} as never, mockRes as never);

      assert.deepStrictEqual(mockRes.render.mock.calls[0].arguments, ['index']);
    });
  });

  describe('#signup', () => {
    it('renders an error is email is not provided', async () => {
      await controller.signup({ body: {} } as never, mockRes as never);

      assert.deepStrictEqual(mockRes.render.mock.calls[0].arguments, [
        'index',
        { errorMessage: 'Email is required!' },
      ]);
    });

    it('shows a warning if the user has already signed up', async (t) => {
      t.mock.method(User, 'findOne', () => ({
        exec: () => Promise.resolve({ email: 'foo@bar.com' }),
      }));

      await controller.signup(
        { body: { email: 'foo@bar.com' } } as never,
        mockRes as never,
      );

      assert.deepStrictEqual(mockRes.render.mock.calls[0].arguments, [
        'index',
        {
          errorMessage:
            'foo@bar.com is already signed up to receive notifications!',
        },
      ]);
    });

    it('redirects to the yahoo auth page', async (t) => {
      t.mock.method(User, 'findOne', () => ({
        exec: () => Promise.resolve(null),
      }));
      t.mock.method(yahooAuth.code, 'getUri', () => 'https://yahoo.test/auth');

      await controller.signup(
        { body: { email: 'foo@bar.com' } } as never,
        mockRes as never,
      );

      assert.deepStrictEqual(mockRes.redirect.mock.calls[0].arguments, [
        'https://yahoo.test/auth',
      ]);
    });
  });

  describe('#authCallback', () => {
    it('throws an error if set in the request', async () => {
      await assert.rejects(
        controller.authCallback(
          { query: { error: 'auth failed' } } as never,
          mockRes as never,
        ),
        new Error('auth failed'),
      );
    });

    it('calls updateLeagues and renders a success message', async (t) => {
      updateLeagues.mock.mockImplementation((user) => {
        user.leagues = [{ name: 'league 1' }, { name: 'league 2' }];
      });
      t.mock.method(User.prototype, 'save', async () => undefined);
      t.mock.method(yahooAuth.code, 'getToken', async () => ({
        accessToken: 'access',
        expires: new Date(),
        refreshToken: 'refresh',
      }));

      await controller.authCallback(
        {
          query: { code: 'test' },
          originalUrl: 'https://orig.com',
        } as never,
        mockRes as never,
      );

      assert.deepStrictEqual(mockRes.render.mock.calls[0].arguments, [
        'index',
        {
          successMessage: `All done! You'll start receiving transaction
          notifications for league 1, league 2.`,
        },
      ]);
      assert.equal(updateLeagues.mock.callCount(), 1);
    });

    it('renders a warning if no leagues were found', async (t) => {
      updateLeagues.mock.mockImplementation((user) => {
        user.leagues = [];
      });
      t.mock.method(User.prototype, 'save', async () => undefined);
      t.mock.method(yahooAuth.code, 'getToken', async () => ({
        accessToken: 'access',
        expires: new Date(),
        refreshToken: 'refresh',
      }));

      await controller.authCallback(
        {
          query: { code: 'test' },
          originalUrl: 'https://orig.com',
        } as never,
        mockRes as never,
      );

      assert.deepStrictEqual(mockRes.render.mock.calls[0].arguments, [
        'index',
        { errorMessage: 'No fantasy football leagues found for your account!' },
      ]);
      assert.equal(updateLeagues.mock.callCount(), 1);
    });
  });

  describe('#unsubscribe', () => {
    it('renders an error if and invalid ID is provided', async () => {
      await controller.unsubscribe(
        { params: { id: '123' } } as never,
        mockRes as never,
      );

      assert.deepStrictEqual(mockRes.render.mock.calls[0].arguments, [
        'index',
        { errorMessage: 'Invalid user ID' },
      ]);
    });

    it('renders an error if ID does not match an account', async (t) => {
      t.mock.method(User, 'findByIdAndDelete', async () => null);

      await controller.unsubscribe(
        { params: { id: '5f93a6a9dcb7a060bd1f1f2d' } } as never,
        mockRes as never,
      );

      assert.deepStrictEqual(mockRes.render.mock.calls[0].arguments, [
        'index',
        { errorMessage: 'No email found matching this account' },
      ]);
    });

    it('calls the function to delete the user if the ID matches', async (t) => {
      t.mock.method(User, 'findByIdAndDelete', async () => ({
        email: 'foo@bar.com',
      }));

      await controller.unsubscribe(
        { params: { id: '5f93a6a9dcb7a060bd1f1f2d' } } as never,
        mockRes as never,
      );

      assert.deepStrictEqual(mockRes.render.mock.calls[0].arguments, [
        'index',
        { successMessage: 'foo@bar.com has been unsubscribed' },
      ]);
    });
  });

  describe('#handleError', () => {
    it('instructs user to allow on Yahoo if access denied', () => {
      controller.handleError(
        new Error('access_denied'),
        {} as never,
        mockRes as never,
        (() => {}) as never,
      );

      assert.deepStrictEqual(mockRes.render.mock.calls[0].arguments, [
        'index',
        {
          errorMessage:
            'You must click "Allow" to authorize Fantasy Notify\n' +
            "      to monitor your league's transactions.",
        },
      ]);
    });

    it('prints other errors to the console and sets errorMessage', (t) => {
      const consoleSpy = t.mock.method(console, 'error', () => {});

      controller.handleError(
        new Error('Other error'),
        {} as never,
        mockRes as never,
        (() => {}) as never,
      );

      assert.match(consoleSpy.mock.calls[0].arguments[0], /Other error/);
      assert.deepStrictEqual(mockRes.render.mock.calls[0].arguments, [
        'index',
        { errorMessage: 'Other error' },
      ]);
    });
  });
});

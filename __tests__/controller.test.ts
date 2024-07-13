import { describe, expect, it, vi } from 'vitest';

import * as controller from '../controller.js';
import User from '../User.js';
import * as leagues from '../leagues.js';
import yahooAuth from '../yahooAuth.js';

vi.mock('../yahooAuth.js');

const mockRes = {
  render: vi.fn(),
  redirect: vi.fn(),
};

describe('controller', () => {
  describe('#index', () => {
    it('renders the home page', () => {
      controller.index({}, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('index');
    });
  });

  describe('#signup', () => {
    it('renders an error is email is not provided', async () => {
      await controller.signup({ body: {} }, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('index', {
        errorMessage: 'Email is required!',
      });
    });

    it('shows a warning if the user has already signed up', async () => {
      vi.spyOn(User, 'findOne').mockReturnValue({
        exec: () => Promise.resolve({ email: 'foo@bar.com' }),
      });

      await controller.signup({ body: { email: 'foo@bar.com' } }, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('index', {
        errorMessage:
          'foo@bar.com is already signed up to receive notifications!',
      });
    });

    it('redirects to the yahoo auth page', async () => {
      vi.spyOn(User, 'findOne').mockReturnValue({
        exec: () => Promise.resolve(null),
      });

      await controller.signup({ body: { email: 'foo@bar.com' } }, mockRes);

      expect(mockRes.redirect).toHaveBeenCalled();
    });
  });

  describe('#authCallback', () => {
    it('throws an error if set in the request', () =>
      expect(
        controller.authCallback({ query: { error: 'auth failed' } }, mockRes),
      ).rejects.toEqual(new Error('auth failed')));

    it('calls updateLeagues and renders a success message', async () => {
      vi.spyOn(leagues, 'update').mockImplementation((user) => {
        /* eslint-disable-next-line no-param-reassign */
        user.leagues = [{ name: 'league 1' }, { name: 'league 2' }];
      });
      vi.spyOn(User.prototype, 'save').mockResolvedValue();
      yahooAuth.code.getToken.mockResolvedValue({
        accessToken: 'access',
        expires: new Date(),
        refreshToken: 'refresh',
      });

      await controller.authCallback(
        { query: { code: 'test' }, originalUrl: 'https://orig.com' },
        mockRes,
      );

      expect(mockRes.render.mock.calls[0][1]).toMatchInlineSnapshot(`
        {
          "successMessage": "All done! You'll start receiving transaction
                  notifications for league 1, league 2.",
        }
      `);
    });

    it('renders a warning if no leagues were found', async () => {
      vi.spyOn(leagues, 'update').mockImplementation((user) => {
        /* eslint-disable-next-line no-param-reassign */
        user.leagues = [];
      });
      vi.spyOn(User.prototype, 'save').mockResolvedValue();
      yahooAuth.code.getToken.mockResolvedValue({
        accessToken: 'access',
        expires: new Date(),
        refreshToken: 'refresh',
      });

      await controller.authCallback(
        { query: { code: 'test' }, originalUrl: 'https://orig.com' },
        mockRes,
      );

      expect(mockRes.render).toHaveBeenCalledWith('index', {
        errorMessage: 'No fantasy football leagues found for your account!',
      });
    });
  });

  describe('#unsubscribe', () => {
    it('renders an error if and invalid ID is provided', async () => {
      await controller.unsubscribe({ params: { id: '123' } }, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('index', {
        errorMessage: 'Invalid user ID',
      });
    });

    it('renders an error if ID does not match an account', async () => {
      vi.spyOn(User, 'findByIdAndDelete').mockResolvedValue(null);

      await controller.unsubscribe(
        { params: { id: '5f93a6a9dcb7a060bd1f1f2d' } },
        mockRes,
      );

      expect(mockRes.render).toHaveBeenCalledWith('index', {
        errorMessage: 'No email found matching this account',
      });
    });

    it('calls the function to delete the user if the ID matches', async () => {
      vi.spyOn(User, 'findByIdAndDelete').mockResolvedValue({
        email: 'foo@bar.com',
      });

      await controller.unsubscribe(
        { params: { id: '5f93a6a9dcb7a060bd1f1f2d' } },
        mockRes,
      );

      expect(mockRes.render).toHaveBeenCalledWith('index', {
        successMessage: 'foo@bar.com has been unsubscribed',
      });
    });
  });

  describe('#handleError', () => {
    it('instructs user to allow on Yahoo if access denied', () => {
      controller.handleError(new Error('access_denied'), {}, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('index', {
        errorMessage:
          'You must click "Allow" to authorize Fantasy Notify\n' +
          "      to monitor your league's transactions.",
      });
    });

    it('prints other errors to the console and sets errorMessage', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockReturnValue();

      controller.handleError(new Error('Other error'), {}, mockRes);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Other error'),
      );
      expect(mockRes.render).toHaveBeenCalledWith('index', {
        errorMessage: 'Other error',
      });
    });
  });
});

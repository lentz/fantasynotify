const controller = require('../controller');
const User = require('../User');
const leagues = require('../leagues');
const yahooAuth = require('../yahooAuth');

jest.mock('../yahooAuth');

const mockRes = {
  render: jest.fn(),
  redirect: jest.fn(),
};

describe('controller', () => {
  describe('#index', () => {
    test('renders the home page', () => {
      controller.index({}, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('index');
    });
  });

  describe('#signup', () => {
    test('renders an error is email is not provided', async () => {
      await controller.signup({ body: { } }, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'index',
        { errorMessage: 'Email is required!' },
      );
    });

    test('shows a warning if the user has already signed up', async () => {
      jest.spyOn(User, 'findOne').mockReturnValue({
        exec: () => Promise.resolve({ email: 'foo@bar.com' }),
      });

      await controller.signup({ body: { email: 'foo@bar.com' } }, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'index',
        { errorMessage: 'foo@bar.com is already signed up to receive notifications!' },
      );
    });

    test('redirects to the yahoo auth page', async () => {
      jest.spyOn(User, 'findOne').mockReturnValue({
        exec: () => Promise.resolve(null),
      });

      await controller.signup({ body: { email: 'foo@bar.com' } }, mockRes);

      expect(mockRes.redirect).toHaveBeenCalled();
    });
  });

  describe('#authCallback', () => {
    test('throws an error if set in the request', () => expect(controller.authCallback({ query: { error: 'auth failed' } }, mockRes))
      .rejects.toEqual(new Error('auth failed')));

    test('calls updateLeagues and renders a success message', async () => {
      jest.spyOn(leagues, 'updateForUser').mockImplementation((user) => {
        /* eslint-disable-next-line no-param-reassign */
        user.leagues = [{ name: 'league 1' }, { name: 'league 2' }];
      });
      jest.spyOn(User.prototype, 'save').mockResolvedValue();
      yahooAuth.code.getToken.mockResolvedValue({
        accessToken: 'access',
        expires: new Date(),
        refreshToken: 'refresh',
      });

      await controller.authCallback(
        { query: {}, originalUrl: 'https://orig.com' },
        mockRes,
      );

      expect(mockRes.render).toHaveBeenCalledWith(
        'index',
        {
          successMessage: 'All done! You\'ll start receiving transaction\n'
          + '      notifications for league 1, league 2.',
        },
      );
    });

    test('renders a warning if no leagues were found', async () => {
      jest.spyOn(leagues, 'updateForUser').mockImplementation((user) => {
        /* eslint-disable-next-line no-param-reassign */
        user.leagues = [];
      });
      jest.spyOn(User.prototype, 'save').mockResolvedValue();
      yahooAuth.code.getToken.mockResolvedValue({
        accessToken: 'access',
        expires: new Date(),
        refreshToken: 'refresh',
      });

      await controller.authCallback(
        { query: {}, originalUrl: 'https://orig.com' },
        mockRes,
      );

      expect(mockRes.render).toHaveBeenCalledWith(
        'index',
        { errorMessage: 'No fantasy football leagues found for your account!' },
      );
    });
  });

  describe('#unsubscribe', () => {
    test('renders an error if ID does not match an account', async () => {
      jest.spyOn(User, 'findByIdAndDelete').mockResolvedValue(null);

      await controller.unsubscribe({ params: { id: '123' } }, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'index',
        { errorMessage: 'No email found matching this account' },
      );
    });

    test('calls the function to delete the user if the ID matches', async () => {
      jest.spyOn(User, 'findByIdAndDelete').mockResolvedValue({ email: 'foo@bar.com' });

      await controller.unsubscribe({ params: { id: '123' } }, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'index',
        { successMessage: 'foo@bar.com has been unsubscribed' },
      );
    });
  });

  describe('#handleError', () => {
    test('instructs user to allow on Yahoo if access denied', () => {
      controller.handleError(new Error('access_denied'), {}, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'index',
        {
          errorMessage: 'You must click "Allow" to authorize Fantasy Notify\n'
          + '      to monitor your league\'s transactions.',
        },
      );
    });

    test('prints other errors to the console and sets errorMessage', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockReturnValue();

      controller.handleError(new Error('Other error'), {}, mockRes);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Other error'));
      expect(mockRes.render).toHaveBeenCalledWith(
        'index',
        { errorMessage: 'Other error' },
      );
    });
  });
});

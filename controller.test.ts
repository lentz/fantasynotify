import { afterEach, describe, it, mock } from 'node:test';
import { deepStrictEqual, rejects, strictEqual } from 'node:assert';

mock.module('./config.ts', {
  defaultExport: {},
});

// mock.module('./leagues.ts', {
//   namedExports: {},
// });

const controller = await import('./controller.ts');
const { default: User } = await import('./User.ts');
const leagues = await import('./leagues.ts');
const { default: yahooAuth } = await import('./yahooAuth.ts');

// vi.mock('../yahooAuth.ts');

const mockRes = {
  render: mock.fn(),
  redirect: mock.fn(),
};

describe('controller', () => {
  afterEach(() => {
    mockRes.render.mock.resetCalls();
  });

  describe('#signup', () => {
    it('renders an error is email is not provided', async () => {
      await controller.signup({ body: {} }, mockRes);

      mockRes.render.mock.calls;
      deepStrictEqual(mockRes.render.mock.calls[0].arguments, [
        'index',
        {
          errorMessage: 'Email is required!',
        },
      ]);
    });

    it('shows a warning if the user has already signed up', async (t) => {
      t.mock.method(User, 'findOne', () => {
        return { exec: () => Promise.resolve({ email: 'foo@bar.com' }) };
      });

      await controller.signup({ body: { email: 'foo@bar.com' } }, mockRes);

      deepStrictEqual(mockRes.render.mock.calls[0].arguments, [
        'index',
        {
          errorMessage:
            'foo@bar.com is already signed up to receive notifications!',
        },
      ]);
    });

    it('redirects to the yahoo auth page', async (t) => {
      t.mock.method(yahooAuth.code, 'getUri', () => '');
      t.mock.method(User, 'findOne', () => {
        return { exec: () => Promise.resolve(null) };
      });

      await controller.signup({ body: { email: 'foo@bar.com' } }, mockRes);

      strictEqual(mockRes.redirect.mock.callCount(), 1);
    });
  });

  describe('#authCallback', () => {
    it('throws an error if set in the request', () =>
      rejects(
        controller.authCallback({ query: { error: 'auth failed' } }, mockRes),
        new Error('auth failed'),
      ));

    it('calls updateLeagues and renders a success message', async (t) => {
      t.mock.method(leagues, 'update', (user: any) => {
        user.leagues = [{ name: 'league 1' }, { name: 'league 2' }];
      });
      t.mock.method(User.prototype, 'save');
      t.mock.method(yahooAuth.code, 'getToken', () => {
        return {
          accessToken: 'access',
          expires: new Date(),
          refreshToken: 'refresh',
        };
      });

      await controller.authCallback(
        { query: { code: 'test' }, originalUrl: 'https://orig.com' },
        mockRes,
      );

      deepStrictEqual(mockRes.render.mock.calls[0].arguments[1], {
        successMessage:
          "All done! You'll start receiving transaction notifications for league 1, league 2.",
      });
    });

    // it('renders a warning if no leagues were found', async () => {
    //   vi.spyOn(leagues, 'update').mockImplementation((user) => {
    //     user.leagues = [];
    //   });
    //   vi.spyOn(User.prototype, 'save').mockResolvedValue();
    //   yahooAuth.code.getToken.mockResolvedValue({
    //     accessToken: 'access',
    //     expires: new Date(),
    //     refreshToken: 'refresh',
    //   });
    //
    //   await controller.authCallback(
    //     { query: { code: 'test' }, originalUrl: 'https://orig.com' },
    //     mockRes,
    //   );
    //
    //   expect(mockRes.render).toHaveBeenCalledWith('index', {
    //     errorMessage: 'No fantasy football leagues found for your account!',
    //   });
    // });
  });

  // describe('#unsubscribe', () => {
  //   it('renders an error if and invalid ID is provided', async () => {
  //     await controller.unsubscribe({ params: { id: '123' } }, mockRes);
  //
  //     expect(mockRes.render).toHaveBeenCalledWith('index', {
  //       errorMessage: 'Invalid user ID',
  //     });
  //   });
  //
  //   it('renders an error if ID does not match an account', async () => {
  //     vi.spyOn(User, 'findByIdAndDelete').mockResolvedValue(null);
  //
  //     await controller.unsubscribe(
  //       { params: { id: '5f93a6a9dcb7a060bd1f1f2d' } },
  //       mockRes,
  //     );
  //
  //     expect(mockRes.render).toHaveBeenCalledWith('index', {
  //       errorMessage: 'No email found matching this account',
  //     });
  //   });
  //
  //   it('calls the function to delete the user if the ID matches', async () => {
  //     vi.spyOn(User, 'findByIdAndDelete').mockResolvedValue({
  //       email: 'foo@bar.com',
  //     });
  //
  //     await controller.unsubscribe(
  //       { params: { id: '5f93a6a9dcb7a060bd1f1f2d' } },
  //       mockRes,
  //     );
  //
  //     expect(mockRes.render).toHaveBeenCalledWith('index', {
  //       successMessage: 'foo@bar.com has been unsubscribed',
  //     });
  //   });
  // });
});

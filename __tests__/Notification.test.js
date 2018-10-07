const Notification = require('../Notification');

describe('Notification', () => {
  beforeEach(() => expect.hasAssertions());
  afterEach(() => jest.resetAllMocks());

  process.env.DOMAIN = 'http://test.com';
  const mockUser = { id: '123', email: 'test@test.com' };
  const mockLeague = { name: 'Test League' };
  const mockMailer = { send: jest.fn() };

  test('does not send a notification if addTransaction is not called', () => {
    const notification = new Notification(mockUser, mockMailer);

    notification.send();

    expect(mockMailer.send).not.toBeCalled();
  });

  test('does not send a notification if empty transactions are provided', () => {
    const notification = new Notification(mockUser, mockMailer);
    notification.addTransactions(mockLeague, []);
    notification.addTransactions(mockLeague);

    notification.send();

    expect(mockMailer.send).not.toBeCalled();
  });

  test('renders the transactions when calling send', () => {
    const notification = new Notification(mockUser, mockMailer);
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
    const expectedBody = `<!DOCTYPE HTML>
    <html>
      <head>
        <meta name=\"viewport\" content=\"width=device-width\">
        <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">
      </head>
      <body>
          <h3>Test League</h3>
          <hr />
            <div>
              <p>
                Test Team 1 <span style=\"color: #1e824c\">added</span> <span style=\"font-weight: bold\">Carson Wentz</span> from waivers<br />
                Test Team 1 <span style=\"color: #aa0000\">dropped</span> <span style=\"font-weight: bold\">Alex Smith</span> <br />
              </p>
            </div>
            <div>
              <p>
                Test Team 2 <span style=\"color: #1e824c\">added</span> <span style=\"font-weight: bold\">Zach Ertz</span> from waivers for $7<br />
                Test Team 2 <span style=\"color: #aa0000\">dropped</span> <span style=\"font-weight: bold\">Jordan Reed</span> <br />
              </p>
            </div>
            <div>
              <p>
                Test Team 3 <span style=\"color: #1e824c\">added</span> <span style=\"font-weight: bold\">Jay Ajayi</span> from free agents<br />
                Test Team 3 <span style=\"color: #aa0000\">dropped</span> <span style=\"font-weight: bold\">James Connor</span> <br />
              </p>
            </div>
            <div>
              <p>
                Test Team 4 <span style=\"color: #aa0000\">dropped</span> <span style=\"font-weight: bold\">Antonio Brown</span> <br />
              </p>
            </div>
        <div style=\"text-align: center;\">
          <span style=\"font-size: .75em; color: #666666; margin-top: 40px;\">
            This email was sent by <a href=\"http://test.com\">Fantasy Transaction Notifier</a>
            to test@test.com.
            <a href=\"http://test.com/unsubscribe/123\">Unsubscribe</a>
          </span>
        </div>
      </body>
    </html>
    `.replace(/^\s{4}/gm, '');
    notification.addTransactions(mockLeague, mockTransactions);

    notification.send();

    expect(mockMailer.send).toBeCalledWith({
      from: 'Fantasy Notify <notifications@fantasynotify.herokuapp.com>',
      html: expectedBody,
      to: 'test@test.com',
      subject: 'New transactions in your Yahoo fantasy football league',
    });
  });

  test('creates message with transactions from multiple leagues', () => {
    const notification = new Notification(mockUser, mockMailer);
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
    const expectedBody = `<h3>Test League</h3>
      <hr />
        <div>
          <p>
            Test Team 1 <span style=\"color: #1e824c\">added</span> <span style=\"font-weight: bold\">Carson Wentz</span> from waivers<br />
            Test Team 1 <span style=\"color: #aa0000\">dropped</span> <span style=\"font-weight: bold\">Alex Smith</span> <br />
          </p>
        </div>
      <h3>League 2</h3>
      <hr />
        <div>
          <p>
            Test Team 2 <span style=\"color: #1e824c\">added</span> <span style=\"font-weight: bold\">Zach Ertz</span> from waivers<br />
            Test Team 2 <span style=\"color: #aa0000\">dropped</span> <span style=\"font-weight: bold\">Jordan Reed</span> <br />
          </p>
        </div>`;

    notification.send();

    expect(mockMailer.send).toBeCalledWith(expect.objectContaining({
      html: expect.stringContaining(expectedBody),
    }));
  });
});

import ClientOAuth2 from 'client-oauth2';

import config from './config.js';

export default new ClientOAuth2({
  clientId: config.YAHOO_CLIENT_ID,
  clientSecret: config.YAHOO_CLIENT_SECRET,
  accessTokenUri: 'https://api.login.yahoo.com/oauth2/get_token',
  authorizationUri: 'https://api.login.yahoo.com/oauth2/request_auth',
  redirectUri: `${config.DOMAIN}/auth/callback`,
  scopes: ['fspt-r'],
});

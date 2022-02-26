import ClientOAuth2 from 'client-oauth2';

export default new ClientOAuth2({
  clientId: process.env.YAHOO_CLIENT_ID,
  clientSecret: process.env.YAHOO_CLIENT_SECRET,
  accessTokenUri: 'https://api.login.yahoo.com/oauth2/get_token',
  authorizationUri: 'https://api.login.yahoo.com/oauth2/request_auth',
  redirectUri: `${process.env.DOMAIN}/auth/callback`,
  scopes: ['fspt-r'],
});

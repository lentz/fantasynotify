const { readFileSync } = require('fs');
const handlebars = require('handlebars');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const emailTemplate = handlebars.compile(
  readFileSync('./views/emailLayout.hbs').toString(),
);

handlebars.registerHelper('playerTransaction', (player, bid) => {
  let source = '';
  let action;
  let team;
  if (player.type === 'add') {
    action = '<span style="color: #1e824c">added</span>';
    team = player.destination_team_name;
    if (player.source_type === 'waivers') {
      source = 'from waivers';
      if (bid) {
        source += ` for $${bid}`;
      }
    } else if (player.source_type === 'freeagents') {
      source = 'from free agents';
    }
  } else {
    action = '<span style="color: #aa0000">dropped</span>';
    team = player.source_team_name;
  }
  return `${team} ${action} <span style="font-weight: bold">${player.name}</span> ${source}`;
});

module.exports = class Notification {
  constructor(user, mailer = sgMail) {
    this.leagueTransactions = {};
    this.mailer = mailer;
    this.user = user;
  }

  addTransactions(league, transactions) {
    if (!transactions || !transactions.length) {
      return;
    }
    this.leagueTransactions[league.name] = transactions;
  }

  send() {
    if (!Object.entries(this.leagueTransactions).length) {
      return null;
    }
    const message = {
      to: this.user.email,
      from: 'Fantasy Notify <notifications@fantasynotify.herokuapp.com>',
      subject: `New transactions in ${Object.keys(this.leagueTransactions).join(
        ', ',
      )}`,
      html: emailTemplate({
        leagueTransactions: this.leagueTransactions,
        domain: process.env.DOMAIN,
        userEmail: this.user.email,
        userId: this.user.id,
      }),
    };
    return this.mailer.send(message);
  }
};

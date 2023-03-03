import { readFileSync } from 'fs';
import handlebars from 'handlebars';
import sgMail, { MailService } from '@sendgrid/mail';
import { ILeague, IUser } from './User.js';
import { IPlayer, ITransaction } from './transactions.js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

const emailTemplate = handlebars.compile(
  readFileSync('./views/emailLayout.hbs').toString(),
);

handlebars.registerHelper(
  'playerTransaction',
  (player: IPlayer, bid: number) => {
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
  },
);

export default class Notification {
  leagueTransactions: { [leagueName: string]: ITransaction[] };

  mailer: MailService;

  user: IUser;

  constructor(user: IUser, mailer = sgMail) {
    this.leagueTransactions = {};
    this.mailer = mailer;
    this.user = user;
  }

  addTransactions(league: ILeague, transactions: ITransaction[]) {
    if (!transactions?.length) {
      return;
    }
    this.leagueTransactions[league.name] = transactions;
  }

  send() {
    if (!Object.entries(this.leagueTransactions).length) {
      return null;
    }
    console.log(`Sending notification to ${this.user.email}`);
    const message = {
      to: this.user.email,
      from: 'Fantasy Notify <fantasynotify@buddyduel.net>',
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
}

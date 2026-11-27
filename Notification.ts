import { readFileSync } from 'node:fs';
import handlebars from 'handlebars';
import { Resend } from 'resend';
import config from './config.ts';
import type { IPlayer, ITransaction } from './transactions.ts';
import type { ILeague, IUser } from './User.ts';

const emailTemplate = handlebars.compile(
  readFileSync('./views/emailLayout.hbs').toString(),
);

handlebars.registerHelper(
  'playerTransaction',
  (player: IPlayer, bid: number) => {
    let source = '';
    let action: string;
    let team: string;
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

  mailer: Resend;

  user: IUser;

  constructor(user: IUser, mailer?: Resend) {
    this.leagueTransactions = {};
    this.mailer = mailer ?? new Resend(config.RESEND_API_KEY);
    this.user = user;
  }

  addTransactions(league: ILeague, transactions: ITransaction[]) {
    if (!transactions?.length) {
      return;
    }
    this.leagueTransactions[league.name] = transactions;
  }

  async send() {
    if (!Object.entries(this.leagueTransactions).length) {
      return;
    }
    console.log(`Sending notification to ${this.user.email}`);
    const message = {
      to: this.user.email,
      from: 'Fantasy Notify <onboarding@resend.dev>',
      subject: `New transactions in ${Object.keys(this.leagueTransactions).join(
        ', ',
      )}`,
      html: emailTemplate({
        leagueTransactions: this.leagueTransactions,
        domain: config.DOMAIN,
        userEmail: this.user.email,
        userId: this.user.id,
      }),
    };

    const result = await this.mailer.emails.send(message);

    if (result.error) {
      throw new Error(result.error.message);
    }
  }
}

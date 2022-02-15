import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

import User from './User';
import * as leagues from './leagues';
import yahooAuth from './yahooAuth';

export async function index(_req: Request, res: Response) {
  res.render('index');
}

export async function signup(req: Request, res: Response) {
  const email = req.body.email && req.body.email.trim();
  if (!email || !email.length) {
    return res.render('index', { errorMessage: 'Email is required!' });
  }
  const user = await User.findOne({ email }).exec();
  if (user) {
    return res.render('index', {
      errorMessage: `${email} is already signed up to receive notifications!`,
    });
  }
  return res.redirect(yahooAuth.code.getUri({ state: email }));
}

export async function authCallback(req: Request, res: Response) {
  if (req.query.error) {
    throw new Error(req.query.error as string);
  }
  if (!Object.keys(req.query).length) {
    return res.render('index', {
      errorMessage: 'Invalid callback, please try again.',
    });
  }
  const authUser = await yahooAuth.code.getToken(req.originalUrl);
  const user = new User({
    email: req.query.state,
    accessToken: authUser.accessToken,
    expires: (authUser as any).expires,
    refreshToken: authUser.refreshToken,
  });
  await leagues.update(user);
  let context: any = {
    successMessage: `All done! You'll start receiving transaction
      notifications for ${user.leagues
        .map((league: any) => league.name)
        .join(', ')}.`,
  };
  if (!user.leagues.length) {
    context = {
      errorMessage: 'No fantasy football leagues found for your account!',
    };
  } else {
    await user.save();
  }
  return res.render('index', context);
}

export async function unsubscribe(req: Request, res: Response) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.render('index', { errorMessage: 'Invalid user ID' });
  }

  const user = await User.findByIdAndDelete(req.params.id);
  const context: any = {};
  if (!user) {
    context.errorMessage = 'No email found matching this account';
  } else {
    context.successMessage = `${user.email} has been unsubscribed`;
  }
  return res.render('index', context);
}

export function handleError(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const context = { errorMessage: err.message };
  if (err.message === 'access_denied') {
    context.errorMessage = `You must click "Allow" to authorize Fantasy Notify
      to monitor your league's transactions.`;
  } else {
    console.error(err.stack);
  }
  res.render('index', context);
}

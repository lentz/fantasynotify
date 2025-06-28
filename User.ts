import * as mongoose from 'mongoose';
import mongooseEncryption from 'mongoose-encryption';

import config from './config.ts';
import yahooAuth from './yahooAuth.ts';

export interface ILeague {
  key: string;
  lastNotifiedTransaction?: string;
  name: string;
}

export interface IUser {
  accessToken: string;
  email: string;
  expires: Date;
  id: string;
  leagues: ILeague[];
  refreshToken: string;
  renewToken: () => Promise<void>;
}

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expires: { type: Date, required: true },
    leagues: [
      {
        _id: false,
        key: { type: String, required: true },
        name: { type: String, required: true },
        lastNotifiedTransaction: String,
      },
    ],
  },
  { timestamps: true },
);

if (config.MONGO_ENCRYPTION_KEY) {
  userSchema.plugin(mongooseEncryption, {
    encryptionKey: config.MONGO_ENCRYPTION_KEY,
    signingKey: config.MONGO_SIGNING_KEY,
    encryptedFields: ['accessToken', 'refreshToken'],
    additionalAuthenticatedFields: ['email'],
  });
}

userSchema.methods.renewToken = async function renewToken() {
  const token = yahooAuth.createToken(
    this.accessToken,
    this.refreshToken,
    'bearer',
    {},
  );
  const newToken = await token.refresh();
  this.accessToken = newToken.accessToken;
  // biome-ignore lint/suspicious/noExplicitAny: incorrect type
  this.expires = (newToken as any).expires;
};

export default mongoose.model<IUser>('User', userSchema);

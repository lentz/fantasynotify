import * as mongoose from 'mongoose';
import mongooseEncryption from 'mongoose-encryption';
import yahooAuth from './yahooAuth';

export interface IUser {
  email: string;
  accessToken: string;
  refreshToken: string;
  expires: Date;
  leagues?: {
    key: string;
    name: string;
    lastNotifiedTransaction?: string;
  }[];
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

if (process.env.MONGO_ENCRYPTION_KEY) {
  userSchema.plugin(mongooseEncryption, {
    encryptionKey: process.env.MONGO_ENCRYPTION_KEY,
    signingKey: process.env.MONGO_SIGNING_KEY,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this.expires = (newToken as any).expires;
};

export default mongoose.model('User', userSchema);

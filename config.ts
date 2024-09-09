import { z } from 'zod';

const schema = z.object({
  DOMAIN: z.string().url(),
  MONGO_ENCRYPTION_KEY: z.string(),
  MONGO_SIGNING_KEY: z.string(),
  MONGODB_URI: z.string().url(),
  PORT: z.coerce.number().int(),
  SENDGRID_API_KEY: z.string(),
  YAHOO_CLIENT_ID: z.string(),
  YAHOO_CLIENT_SECRET: z.string(),
});

export default schema.parse(process.env);

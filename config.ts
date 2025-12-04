import * as z from 'zod';

const schema = z.object({
  DOMAIN: z.url(),
  MONGODB_URI: z.url(),
  PORT: z.coerce.number().int(),
  SENDGRID_API_KEY: z.string(),
  YAHOO_CLIENT_ID: z.string(),
  YAHOO_CLIENT_SECRET: z.string(),
});

export default schema.parse(process.env);

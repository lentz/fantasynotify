import { existsSync } from 'node:fs';

import * as z from 'zod';

if (existsSync('.env')) process.loadEnvFile();

const schema = z.object({
  DOMAIN: z.url(),
  MONGODB_URI: z.url(),
  PORT: z.coerce.number().int().default(3000),
  RESEND_API_KEY: z.string(),
  YAHOO_CLIENT_ID: z.string(),
  YAHOO_CLIENT_SECRET: z.string(),
});

export default schema.parse(process.env);

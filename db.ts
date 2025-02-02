import mongoose from 'mongoose';

import config from './config.ts';

mongoose.set('strictQuery', true);
mongoose.connect(config.MONGODB_URI);
mongoose.connection.on('error', (err) => {
  console.error('Unable to connect to Mongo:', err);
  process.exit(1);
});

export default mongoose.connection;

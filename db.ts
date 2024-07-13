import mongoose from 'mongoose';

mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGODB_URI as string);
mongoose.connection.on('error', (err) => {
  console.error('Unable to connect to Mongo:', err);
  process.exit(1);
});

export default mongoose.connection;

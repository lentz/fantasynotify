require('dotenv').config();
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });
mongoose.connection.on('error', (err) => {
  console.error('Unable to connect to Mongo:', err);
  process.exit(1);
});

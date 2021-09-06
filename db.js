require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', (err) => {
  console.error('Unable to connect to Mongo:', err);
  process.exit(1);
});

module.exports = mongoose.connection;

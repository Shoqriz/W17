const express = require('express');
const cookieParser = require('cookie-parser');
const indexRoutes = require('./routes/index');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');

require('dotenv').config();

const PORT = process.env.PORT || 3000;

mongoose.set('strictQuery', false);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

module.exports = {
  connectToDb: (cb) => {
    MongoClient.connect(uri)
      .then((client) => {
        dbConnection = client.db()
        return cb()
      })
      .catch((err) => {
        console.log(err)
        return cb(err)
      })
  },
  getDb: () => dbConnection
}

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: 'https://week-17-shoqri.web.app' }));
app.use('/', indexRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  })
});
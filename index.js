const express = require('express');
const cookieParser = require('cookie-parser');
const indexRoutes = require('./routes/index');
const cors = require('cors');
const app = express();
const functions = require('firebase-functions');
const logger = require("firebase-functions/logger");

const { MongoClient } = require('mongodb');

let dbConnection
let uri = "mongodb+srv://zidan:67gSGw34Q6FllS0O@nodeapi.ndcxh2c.mongodb.net/?retryWrites=true&w=majority";

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

exports.week_17_shoqriz = functions.https.onRequest(app);
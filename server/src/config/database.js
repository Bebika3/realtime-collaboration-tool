const pg = require('pg');
const { MongoClient } = require('mongodb');

let pgPool;
let mongoClient;
let mongoDb;

const connectDatabase = async () => {
  pgPool = new pg.Pool({
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DATABASE || 'collaboration_db'
  });

  mongoClient = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017');
  await mongoClient.connect();
  mongoDb = mongoClient.db(process.env.MONGO_DATABASE || 'collaboration_tool');

  return { pgPool, mongoDb };
};

const getPgPool = () => pgPool;
const getMongoDb = () => mongoDb;

module.exports = {
  connectDatabase,
  getPgPool,
  getMongoDb
};

const redis = require('redis');

let redisClient;

const connectRedis = async () => {
  redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  });

  redisClient.on('error', (err) => console.error('Redis Error', err));
  await redisClient.connect();
  return redisClient;
};

const getRedisClient = () => redisClient;

module.exports = {
  connectRedis,
  getRedisClient
};

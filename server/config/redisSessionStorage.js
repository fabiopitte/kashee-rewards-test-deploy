const redisClient = require('../redisConnection');

class RedisSessionStorage {
  constructor() {}

  async storeCallback(session) {
    const redis = await redisClient.getRedisConnection();
    return await redis.set(session.id, JSON.stringify(session));
  }

  async loadCallback(id) {
    const redis = await redisClient.getRedisConnection();
    const reply = await redis.get(id);
    if (reply) {
      return JSON.parse(reply);
    } else {
      return undefined;
    }
  }

  async deleteCallback(id) {
    const redis = await redisClient.getRedisConnection();
    return await redis.del(id);
  }
}

module.exports = RedisSessionStorage;

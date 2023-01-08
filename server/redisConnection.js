const redis = require('async-redis');
const url = require('url');
const config = require('../server/config');

let redisConnection = null;

const self = (module.exports = {
  async getRedisConnection() {
    if (redisConnection) {
      return redisConnection;
    } else {
      if (process.env.NODE_ENV === 'production') {
        let redisURL = url.parse(config.redisUrl);
        let client = redis.createClient(redisURL.port, redisURL.hostname, {
          no_ready_check: true,
          tls: true,
        });

        if (redisURL.auth) {
          client.auth(redisURL.auth.split(':')[1]);
        }

        redisConnection = client;
        return redisConnection;
      } else {
        let client = await redis.createClient(
          6379,
          process.env.REDIS_HOST || 'localhost'
        );
        client.auth(process.env.REDIS_PASS);
        redisConnection = client;
        return redisConnection;
      }
    }
  },

  getSyncRedisConnection() {
    const redisURL = url.parse(config.redisUrl);
    const password = redisURL.auth.split(':')[1];
    return {
      port: redisURL.port,
      host: redisURL.hostname,
      password,
      tls: true,
    };
  },

  async addRouteCache(req, res, fn) {
    const redis = self.getRedisConnection();
    const path = req.path;
    const cachedValue = await redis.get(path);
    if (cachedValue) {
      res.send(JSON.parse(cachedValue));
    } else {
      try {
        const result = await fn();
        await redis.set(path, JSON.stringify(result), 'EX', 86400);
        res.send(result);
      } catch (ex) {
        res.send(400);
      }
    }
  },

  async removeRouteCache(req) {
    const redis = self.getRedisConnection();
    const path = req.path;
    return await redis.del(path);
  },
});

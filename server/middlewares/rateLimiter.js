import redisClient from '../configs/redis.js';

export const rateLimiter = ({ keyPrefix, limit, windowSeconds }) => {
  return async (req, res, next) => {
    try {
      const identifier = req.user?._id?.toString() || req.ip;
      if (!identifier) {
        return res.status(400).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const redisKey = `${keyPrefix}:${identifier}`;

      // Increment request count
      const current = await redisClient.incr(redisKey);

      // Ensure TTL exists (set only once)
      let ttl = await redisClient.ttl(redisKey);
      if (ttl === -1) {
        await redisClient.expire(redisKey, windowSeconds);
        ttl = windowSeconds;
      }

      // Limit exceeded
      if (current > limit) {
        res.set('Retry-After', ttl);
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please slow down.',
          retryAfterSeconds: ttl,
        });
      }

      return next();
    } catch (err) {
      console.error('Rate limiter error:', err);
      // FAIL-OPEN: do not block app if Redis is down
      return next();
    }
  };
};

import redisClient from '../configs/redis.js';

export const rateLimiter = ({ keyPrefix, limit, windowSeconds }) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const redisKey = `${keyPrefix}:${userId}`;

      const current = await redisClient.incr(redisKey);
      const ttl = await redisClient.ttl(redisKey);

      // Set expiry only once
      if (ttl === -1) {
        await redisClient.expire(redisKey, windowSeconds);
      }

      console.log('[RATE]', { redisKey, current, ttl });

      if (current > limit) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please slow down.',
        });
      }

      return next();
    } catch (err) {
      console.error('Rate limiter error:', err);
      // FAIL-OPEN (do NOT block AI if Redis fails)
      return next();
    }
  };
};

import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL, // rediss:// for Upstash
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected');
});

redisClient.on('ready', () => {
  console.log('🚀 Redis ready');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

await redisClient.connect();

export default redisClient;

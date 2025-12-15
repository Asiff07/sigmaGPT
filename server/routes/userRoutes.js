import express from 'express';
import { getPublishedImages, getUser, loginUser, registerUser } from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';
import { rateLimiter } from '../middlewares/rateLimiter.js';

const userRouter = express.Router();

// Apply rate limiting to registration route
userRouter.post('/register', rateLimiter({
    keyPrefix: 'rate:register',
    limit: 5,
    windowSeconds: 60,
}) ,registerUser);

// Apply rate limiting to login route
userRouter.post('/login', rateLimiter({
    keyPrefix: 'rate:login',
    limit: 3,
    windowSeconds: 60,
}) ,loginUser);

userRouter.get('/data', protect, getUser);

userRouter.get('/published-images', getPublishedImages);

export default userRouter;
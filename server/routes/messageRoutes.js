import express from 'express';
import { protect } from '../middlewares/auth.js';
import { imageMessageController, textMessageController } from '../controllers/messageController.js';
import { rateLimiter } from '../middlewares/rateLimiter.js';

const messageRouter = express.Router();

messageRouter.post('/text',protect,rateLimiter({
    keyPrefix: 'rate:text',
    limit: 2,
    windowSeconds: 60,
}),textMessageController);
messageRouter.post('/image',protect,rateLimiter({
    keyPrefix: 'rate:image',
    limit: 1,
    windowSeconds: 60,
}),imageMessageController)

export default messageRouter;
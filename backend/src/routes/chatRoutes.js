const express = require('express');
const router = express.Router();
const {
  getConversations,
  createConversation,
  getConversation,
  updateConversation,
  deleteConversation,
  clearConversations,
  sendMessageStream,
  updateMessageFeedback
} = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');

// All chat routes are protected by JWT authentication
router.use(authenticate);

router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.delete('/conversations', clearConversations);

router.get('/conversations/:id', getConversation);
router.put('/conversations/:id', updateConversation);
router.delete('/conversations/:id', deleteConversation);

router.post('/message/stream', chatLimiter, sendMessageStream);
router.put('/message/:id/feedback', updateMessageFeedback);

module.exports = router;

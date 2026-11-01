const db = require('../config/db');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const storeFallback = require('../utils/storeFallback');
const { streamGeminiResponse } = require('../services/geminiService');
const { generateTitle } = require('../services/titleService');
const logger = require('../utils/logger');

// Get all conversations for current user
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { search } = req.query;

    let conversations = [];
    if (db.getStatus()) {
      const query = { userId };
      if (search && search.trim()) {
        query.title = { $regex: search.trim(), $options: 'i' };
      }
      conversations = await Conversation.find(query).sort({ updatedAt: -1 });
    } else {
      conversations = await storeFallback.getUserConversations(userId, search);
    }

    return res.status(200).json({
      success: true,
      conversations
    });
  } catch (error) {
    next(error);
  }
};

// Create a new conversation
const createConversation = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { title = 'New Chat', model = 'gemini-1.5-flash', systemInstruction = '' } = req.body;

    let conversation;
    if (db.getStatus()) {
      conversation = await Conversation.create({
        userId,
        title,
        model,
        systemInstruction
      });
    } else {
      conversation = await storeFallback.createConversation(userId, {
        title,
        model,
        systemInstruction
      });
    }

    return res.status(201).json({
      success: true,
      conversation
    });
  } catch (error) {
    next(error);
  }
};

// Get single conversation and its messages
const getConversation = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    let conversation;
    let messages = [];

    if (db.getStatus()) {
      conversation = await Conversation.findOne({ _id: id, userId });
      if (conversation) {
        messages = await Message.find({ conversationId: id, userId }).sort({ createdAt: 1 });
      }
    } else {
      conversation = await storeFallback.getConversationById(id, userId);
      if (conversation) {
        messages = await storeFallback.getMessagesByConversation(id);
      }
    }

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    return res.status(200).json({
      success: true,
      conversation,
      messages
    });
  } catch (error) {
    next(error);
  }
};

// Update conversation title
const updateConversation = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title cannot be empty'
      });
    }

    let conversation;
    if (db.getStatus()) {
      conversation = await Conversation.findOneAndUpdate(
        { _id: id, userId },
        { title: title.trim(), updatedAt: new Date() },
        { new: true }
      );
    } else {
      conversation = await storeFallback.updateConversationTitle(id, userId, title.trim());
    }

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    return res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    next(error);
  }
};

// Delete conversation
const deleteConversation = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    let success = false;
    if (db.getStatus()) {
      const deleted = await Conversation.findOneAndDelete({ _id: id, userId });
      if (deleted) {
        await Message.deleteMany({ conversationId: id, userId });
        success = true;
      }
    } else {
      success = await storeFallback.deleteConversation(id, userId);
    }

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Clear all conversations
const clearConversations = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (db.getStatus()) {
      await Conversation.deleteMany({ userId });
      await Message.deleteMany({ userId });
    } else {
      await storeFallback.clearUserConversations(userId);
    }

    return res.status(200).json({
      success: true,
      message: 'All conversations cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Send message & stream Gemini response via SSE
const sendMessageStream = async (req, res, next) => {
  const userId = req.user._id || req.user.id;
  const { conversationId, prompt, model, apiKeyOverride, systemInstruction } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Question prompt cannot be empty'
    });
  }

  try {
    // 1. Verify or create conversation
    let convId = conversationId;
    let isNewConversation = false;

    if (db.getStatus()) {
      let conv = convId ? await Conversation.findOne({ _id: convId, userId }) : null;
      if (!conv) {
        conv = await Conversation.create({
          userId,
          title: 'New Chat',
          model: model || config.GEMINI_MODEL || 'gemini-3.6-flash',
          systemInstruction: systemInstruction || ''
        });
        convId = conv._id;
        isNewConversation = true;
      }
    } else {
      let conv = convId ? await storeFallback.getConversationById(convId, userId) : null;
      if (!conv) {
        conv = await storeFallback.createConversation(userId, {
          title: 'New Chat',
          model: model || config.GEMINI_MODEL || 'gemini-3.6-flash',
          systemInstruction: systemInstruction || ''
        });
        convId = conv._id;
        isNewConversation = true;
      }
    }

    // 2. Fetch existing history for context memory
    let history = [];
    if (db.getStatus()) {
      history = await Message.find({ conversationId: convId, userId }).sort({ createdAt: 1 });
    } else {
      history = await storeFallback.getMessagesByConversation(convId);
    }

    // 3. Save User Message
    let userMsg;
    if (db.getStatus()) {
      userMsg = await Message.create({
        conversationId: convId,
        userId,
        role: 'user',
        content: prompt.trim()
      });
      await Conversation.findByIdAndUpdate(convId, { updatedAt: new Date() });
    } else {
      userMsg = await storeFallback.createMessage({
        conversationId: convId,
        userId,
        role: 'user',
        content: prompt.trim()
      });
    }

    // 4. Setup SSE Streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering
    if (res.flushHeaders) res.flushHeaders();

    // Send initial metadata event
    res.write(
      `data: ${JSON.stringify({
        type: 'meta',
        conversationId: convId,
        userMessage: userMsg
      })}\n\n`
    );

    let fullAIResponse = '';
    let isAborted = false;

    req.on('close', () => {
      isAborted = true;
      logger.info(`Client aborted stream connection for conversation: ${convId}`);
    });

    // 5. Call Gemini stream
    const stream = streamGeminiResponse({
      prompt: prompt.trim(),
      history,
      apiKey: apiKeyOverride,
      model,
      systemInstruction
    });

    for await (const chunk of stream) {
      if (isAborted) break;
      fullAIResponse += chunk;
      res.write(
        `data: ${JSON.stringify({
          type: 'chunk',
          text: chunk,
          done: false
        })}\n\n`
      );
    }

    // 6. Save Model Message
    let modelMsg;
    if (db.getStatus()) {
      modelMsg = await Message.create({
        conversationId: convId,
        userId,
        role: 'model',
        content: fullAIResponse,
        modelUsed: model || config.GEMINI_MODEL || 'gemini-3.6-flash'
      });
    } else {
      modelMsg = await storeFallback.createMessage({
        conversationId: convId,
        userId,
        role: 'model',
        content: fullAIResponse,
        modelUsed: model || config.GEMINI_MODEL || 'gemini-3.6-flash'
      });
    }

    // 7. Check if title auto-generation is needed (if new conversation or first prompt)
    let autoTitle = null;
    if (isNewConversation || history.length === 0) {
      try {
        autoTitle = generateTitle(prompt);
        if (db.getStatus()) {
          await Conversation.findByIdAndUpdate(convId, { title: autoTitle });
        } else {
          await storeFallback.updateConversationTitle(convId, userId, autoTitle);
        }
      } catch (err) {
        logger.warn('Failed to auto-update title:', err.message);
      }
    }

    // 8. Send completion event
    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        done: true,
        messageId: modelMsg._id || modelMsg.id,
        conversationId: convId,
        title: autoTitle
      })}\n\n`
    );

    res.end();
  } catch (error) {
    logger.error('Error during message streaming:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Stream generation failed'
      });
    } else {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          error: error.message || 'An error occurred while streaming response'
        })}\n\n`
      );
      res.end();
    }
  }
};

// Update message feedback (like/dislike)
const updateMessageFeedback = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { feedback } = req.body;

    if (!['like', 'dislike', 'none'].includes(feedback)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback value'
      });
    }

    let message;
    if (db.getStatus()) {
      message = await Message.findOneAndUpdate(
        { _id: id, userId },
        { feedback },
        { new: true }
      );
    } else {
      message = await storeFallback.updateMessageFeedback(id, userId, feedback);
    }

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    return res.status(200).json({
      success: true,
      feedback: message.feedback
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  createConversation,
  getConversation,
  updateConversation,
  deleteConversation,
  clearConversations,
  sendMessageStream,
  updateMessageFeedback
};

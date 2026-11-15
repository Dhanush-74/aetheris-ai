const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Local JSON store path for persistent fallback if MongoDB is not connected
const DATA_FILE = path.resolve(__dirname, '../../.local-data.json');

class StoreFallback {
  constructor() {
    this.users = [];
    this.conversations = [];
    this.messages = [];
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(raw);
        this.users = data.users || [];
        this.conversations = data.conversations || [];
        this.messages = data.messages || [];
      }
    } catch (err) {
      logger.warn('Failed to load local fallback file, starting fresh', err.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
          {
            users: this.users,
            conversations: this.conversations,
            messages: this.messages
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (err) {
      logger.warn('Failed to save local fallback data', err.message);
    }
  }

  // User operations
  async createUser({ name, email, password }) {
    const existing = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('User with this email already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      _id: uuidv4(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      preferences: {
        theme: 'dark',
        geminiModel: 'gemini-1.5-flash',
        customInstruction: ''
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.push(user);
    this.save();
    return user;
  }

  async findUserByEmail(email) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async findUserById(id) {
    return this.users.find(u => u._id === id || u.id === id) || null;
  }

  async updateUserPreferences(id, preferences) {
    const user = await this.findUserById(id);
    if (!user) return null;
    user.preferences = { ...user.preferences, ...preferences };
    user.updatedAt = new Date().toISOString();
    this.save();
    return user;
  }

  // Conversation operations
  async createConversation(userId, { title = 'New Chat', model = 'gemini-1.5-flash', systemInstruction = '' }) {
    const conv = {
      _id: uuidv4(),
      userId: userId.toString(),
      title,
      isPinned: false,
      model,
      systemInstruction,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.conversations.push(conv);
    this.save();
    return conv;
  }

  async getUserConversations(userId, search = '') {
    let list = this.conversations.filter(c => c.userId === userId.toString());
    if (search && search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  async getConversationById(id, userId) {
    return this.conversations.find(c => c._id === id && c.userId === userId.toString()) || null;
  }

  async updateConversationTitle(id, userId, title) {
    const conv = await this.getConversationById(id, userId);
    if (!conv) return null;
    conv.title = title;
    conv.updatedAt = new Date().toISOString();
    this.save();
    return conv;
  }

  async deleteConversation(id, userId) {
    const idx = this.conversations.findIndex(c => c._id === id && c.userId === userId.toString());
    if (idx === -1) return false;
    this.conversations.splice(idx, 1);
    this.messages = this.messages.filter(m => m.conversationId !== id);
    this.save();
    return true;
  }

  async clearUserConversations(userId) {
    const userConvIds = this.conversations
      .filter(c => c.userId === userId.toString())
      .map(c => c._id);
    this.conversations = this.conversations.filter(c => c.userId !== userId.toString());
    this.messages = this.messages.filter(m => !userConvIds.includes(m.conversationId));
    this.save();
    return true;
  }

  // Message operations
  async createMessage({ conversationId, userId, role, content, modelUsed = '', feedback = 'none' }) {
    const msg = {
      _id: uuidv4(),
      conversationId,
      userId: userId.toString(),
      role,
      content,
      modelUsed,
      feedback,
      createdAt: new Date().toISOString()
    };
    this.messages.push(msg);

    // Update conversation updatedAt
    const conv = this.conversations.find(c => c._id === conversationId);
    if (conv) {
      conv.updatedAt = new Date().toISOString();
    }
    this.save();
    return msg;
  }

  async getMessagesByConversation(conversationId, limit = 100) {
    return this.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-limit);
  }

  async updateMessageFeedback(messageId, userId, feedback) {
    const msg = this.messages.find(m => m._id === messageId && m.userId === userId.toString());
    if (!msg) return null;
    msg.feedback = feedback;
    this.save();
    return msg;
  }
}

const storeFallback = new StoreFallback();

module.exports = storeFallback;

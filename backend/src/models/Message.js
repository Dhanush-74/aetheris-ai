const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    role: {
      type: String,
      required: true,
      enum: ['user', 'model', 'system'],
      default: 'user'
    },
    content: {
      type: String,
      required: true
    },
    feedback: {
      type: String,
      enum: ['like', 'dislike', 'none'],
      default: 'none'
    },
    modelUsed: {
      type: String,
      default: ''
    },
    error: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);

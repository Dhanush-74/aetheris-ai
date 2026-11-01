const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'New Chat',
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    systemInstruction: {
      type: String,
      default: ''
    },
    model: {
      type: String,
      default: 'gemini-1.5-flash'
    }
  },
  {
    timestamps: true
  }
);

conversationSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);

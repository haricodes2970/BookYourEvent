const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

/**
 * FIX: Deduplicated chats — one thread per user pair.
 * Before creating a chat, we check if one already exists between the two users.
 * The Chat model should have a compound unique index on participants (see note below).
 *
 * ADD THIS INDEX to Server/models/Chat.js:
 *   ChatSchema.index({ participants: 1 });
 *   // Enforce uniqueness at application level (handled here) since
 *   // MongoDB array field unique index doesn't work as expected for pairs.
 */

// ── Open or find existing chat ────────────────────────────────────────────
exports.openChat = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { otherUserId, bookingId, username } = req.body;

    let targetUserId = otherUserId;

    // Support opening chat by username
    if (!targetUserId && username) {
      const targetUser = await User.findOne({
        $or: [
          { username: new RegExp(`^${username}$`, 'i') },
          { name: new RegExp(`^${username}$`, 'i') },
        ],
      });
      if (!targetUser) return res.status(404).json({ message: 'User not found' });
      targetUserId = targetUser._id;
    }

    if (!targetUserId) return res.status(400).json({ message: 'otherUserId or username required' });
    if (targetUserId.toString() === currentUserId.toString()) {
      return res.status(400).json({ message: 'Cannot chat with yourself' });
    }

    // ── KEY FIX: Find existing chat between these two users ──────────────
    const existingChat = await Chat.findOne({
      participants: { $all: [currentUserId, targetUserId], $size: 2 },
    }).populate('participants', 'name email avatar');

    if (existingChat) {
      return res.json(existingChat);
    }

    // No existing chat — create new one
    const newChat = await Chat.create({
      participants: [currentUserId, targetUserId],
      booking: bookingId || null,
    });

    const populated = await Chat.findById(newChat._id)
      .populate('participants', 'name email avatar');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Get all chats for current user ───────────────────────────────────────
exports.getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'name email avatar')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    // Deduplicate in case duplicates exist in DB already
    const seen = new Set();
    const dedupedChats = chats.filter(chat => {
      const key = chat.participants
        .map(p => p._id.toString())
        .sort()
        .join('_');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json(dedupedChats);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Get messages for a chat ───────────────────────────────────────────────
exports.getChatMessages = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const isParticipant = chat.participants
      .map(p => p.toString())
      .includes(req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ message: 'Not authorized' });

    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Send a message ────────────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message text required' });

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const isParticipant = chat.participants
      .map(p => p.toString())
      .includes(req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ message: 'Not authorized' });

    const message = await Message.create({
      chat: req.params.chatId,
      sender: req.user._id,
      text: text.trim(),
    });

    // Update chat's updatedAt so it bubbles to top in getMyChats
    await Chat.findByIdAndUpdate(req.params.chatId, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

    const populated = await Message.findById(message._id).populate('sender', 'name avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Mark chat as read ─────────────────────────────────────────────────────
exports.markChatRead = async (req, res) => {
  try {
    await Message.updateMany(
      { chat: req.params.chatId, sender: { $ne: req.user._id }, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Search users for chat ─────────────────────────────────────────────────
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const users = await User.find({
      $or: [
        { username: new RegExp(q, 'i') },
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
      ],
      _id: { $ne: req.user._id },
    }).select('name username email avatar').limit(10);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

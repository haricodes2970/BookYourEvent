const express = require('express');
const router = express.Router();
const {
    getOrCreateChat,
    getMyChats,
    getChatMessages,
    sendMessage,
    markChatRead,
} = require('../controllers/ChatController');
const { protect } = require('../middleware/authMiddleware');

router.post('/open', protect, getOrCreateChat);
router.get('/', protect, getMyChats);
router.get('/:chatId/messages', protect, getChatMessages);
router.post('/:chatId/messages', protect, sendMessage);
router.patch('/:chatId/read', protect, markChatRead);

module.exports = router;

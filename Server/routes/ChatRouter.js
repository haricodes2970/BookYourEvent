const express = require('express');
const router = express.Router();
const {
    openChat,
    getMyChats,
    getChatMessages,
    sendMessage,
    markChatRead,
    searchUsers,
} = require('../controllers/ChatController');
const { protect } = require('../middleware/authMiddleware');

router.post('/open', protect, openChat);
router.get('/', protect, getMyChats);
router.get('/users/search', protect, searchUsers);
router.get('/:chatId/messages', protect, getChatMessages);
router.post('/:chatId/messages', protect, sendMessage);
router.patch('/:chatId/read', protect, markChatRead);

module.exports = router;
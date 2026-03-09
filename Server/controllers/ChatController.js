const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Booking = require('../models/Booking');

const toSortedParticipants = (id1, id2) => [id1.toString(), id2.toString()].sort();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const userInChat = (chat, userId) =>
    chat.participants.some((participantId) => participantId.toString() === userId);

const getOrCreateChat = async (req, res) => {
    try {
        const { otherUserId, bookingId } = req.body;
        const currentUserId = req.user.id;

        let resolvedOtherUserId = otherUserId;
        let resolvedBookingId = null;
        let resolvedVenueId = null;

        if (bookingId) {
            if (!isValidObjectId(bookingId))
                return res.status(400).json({ message: 'Invalid booking ID' });

            const booking = await Booking.findById(bookingId).populate('venue', 'owner');
            if (!booking)
                return res.status(404).json({ message: 'Booking not found' });

            const bookerId = booking.booker.toString();
            const ownerId = booking.venue?.owner?.toString();
            if (!ownerId)
                return res.status(400).json({ message: 'Booking venue owner not found' });

            if (![bookerId, ownerId].includes(currentUserId))
                return res.status(403).json({ message: 'Unauthorized to open chat for this booking' });

            resolvedOtherUserId = currentUserId === bookerId ? ownerId : bookerId;

            if (otherUserId && otherUserId.toString() !== resolvedOtherUserId)
                return res.status(400).json({ message: 'otherUserId does not match booking participants' });

            resolvedBookingId = booking._id;
            resolvedVenueId = booking.venue._id;
        } else {
            if (!otherUserId)
                return res.status(400).json({ message: 'otherUserId is required' });
            if (!isValidObjectId(otherUserId))
                return res.status(400).json({ message: 'Invalid otherUserId' });
            if (otherUserId.toString() === currentUserId)
                return res.status(400).json({ message: 'Cannot create a chat with yourself' });
        }

        if (!resolvedOtherUserId || resolvedOtherUserId.toString() === currentUserId)
            return res.status(400).json({ message: 'Invalid chat participants' });

        const participants = toSortedParticipants(currentUserId, resolvedOtherUserId);
        const chatQuery = {
            participants,
            booking: resolvedBookingId || null,
        };

        let chat = await Chat.findOne(chatQuery);

        if (!chat) {
            chat = await Chat.create({
                participants,
                booking: resolvedBookingId || null,
                venue: resolvedVenueId || null,
                lastMessage: '',
                lastMessageAt: new Date(),
            });
        }

        chat = await Chat.findById(chat._id)
            .populate('participants', 'name role email')
            .populate('venue', 'name')
            .populate('booking', 'eventDate startTime endTime status');

        res.status(200).json({ chat });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getMyChats = async (req, res) => {
    try {
        const chats = await Chat.find({ participants: req.user.id })
            .populate('participants', 'name role email')
            .populate('venue', 'name')
            .populate('booking', 'eventDate startTime endTime status')
            .sort({ lastMessageAt: -1 });

        const data = chats.map((chat) => {
            const chatObj = chat.toObject();
            chatObj.otherParticipant = chatObj.participants.find(
                (participant) => participant._id.toString() !== req.user.id
            ) || null;
            return chatObj;
        });

        res.status(200).json({ count: data.length, chats: data });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        if (!isValidObjectId(chatId))
            return res.status(400).json({ message: 'Invalid chat ID' });

        const chat = await Chat.findById(chatId);
        if (!chat)
            return res.status(404).json({ message: 'Chat not found' });
        if (!userInChat(chat, req.user.id))
            return res.status(403).json({ message: 'Unauthorized' });

        const messages = await Message.find({ chat: chatId })
            .populate('sender', 'name role')
            .sort({ createdAt: 1 });

        res.status(200).json({ count: messages.length, messages });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const text = req.body?.text?.trim();

        if (!isValidObjectId(chatId))
            return res.status(400).json({ message: 'Invalid chat ID' });
        if (!text)
            return res.status(400).json({ message: 'Message text is required' });

        const chat = await Chat.findById(chatId);
        if (!chat)
            return res.status(404).json({ message: 'Chat not found' });
        if (!userInChat(chat, req.user.id))
            return res.status(403).json({ message: 'Unauthorized' });

        let message = await Message.create({
            chat: chat._id,
            sender: req.user.id,
            text,
            readBy: [req.user.id],
        });

        chat.lastMessage = text.slice(0, 200);
        chat.lastMessageAt = new Date();
        chat.lastMessageSender = req.user.id;
        await chat.save();

        message = await message.populate('sender', 'name role');

        res.status(201).json({ message: message });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const markChatRead = async (req, res) => {
    try {
        const { chatId } = req.params;
        if (!isValidObjectId(chatId))
            return res.status(400).json({ message: 'Invalid chat ID' });

        const chat = await Chat.findById(chatId);
        if (!chat)
            return res.status(404).json({ message: 'Chat not found' });
        if (!userInChat(chat, req.user.id))
            return res.status(403).json({ message: 'Unauthorized' });

        const result = await Message.updateMany(
            {
                chat: chatId,
                sender: { $ne: req.user.id },
                readBy: { $ne: req.user.id },
            },
            {
                $push: { readBy: req.user.id },
            }
        );

        res.status(200).json({ updated: result.modifiedCount || 0 });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = {
    getOrCreateChat,
    getMyChats,
    getChatMessages,
    sendMessage,
    markChatRead,
};

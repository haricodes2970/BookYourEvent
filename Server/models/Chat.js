const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }],
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        default: null,
    },
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue',
        default: null,
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null,
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
    },
    lastMessageSender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, { timestamps: true });

chatSchema.pre('validate', function(next) {
    if (!Array.isArray(this.participants) || this.participants.length !== 2) {
        return next(new Error('Chat must have exactly two participants'));
    }

    const sortedIds = this.participants
        .map((id) => id.toString())
        .sort();

    if (sortedIds[0] === sortedIds[1]) {
        return next(new Error('Participants must be two different users'));
    }

    this.participants = sortedIds.map((id) => new mongoose.Types.ObjectId(id));
    next();
});

chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);

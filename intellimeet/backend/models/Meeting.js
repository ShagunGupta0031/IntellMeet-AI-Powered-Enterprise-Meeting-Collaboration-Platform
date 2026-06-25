const mongoose = require('mongoose');
const { Schema } = mongoose;

const sentimentSnapshotSchema = new Schema(
  {
    positive: Number,
    neutral: Number,
    negative: Number,
    capturedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const talkTimeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    seconds: { type: Number, default: 0 },
  },
  { _id: false }
);

const interruptionSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: 'User' },
    target: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const meetingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    roomCode: { type: String, required: true, unique: true }, // e.g. MTG-8472-XQ
    host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled' },
    scheduledFor: { type: Date },
    startedAt: { type: Date },
    endedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },

    // AI-derived data
    summary: { type: String, default: '' },
    summaryHistory: [{ text: String, at: { type: Date, default: Date.now } }],
    keyDecisions: [{ type: String }],
    keyTopics: [{ type: String }],
    sentimentHistory: [sentimentSnapshotSchema],
    talkTime: [talkTimeSchema],
    interruptions: [interruptionSchema],
    recordingUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

// roomCode already has a unique index via `unique: true` above — no need to redeclare it.
meetingSchema.index({ host: 1, createdAt: -1 });

module.exports = mongoose.model('Meeting', meetingSchema);

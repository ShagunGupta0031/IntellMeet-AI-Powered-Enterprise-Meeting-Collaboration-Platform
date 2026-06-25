const mongoose = require('mongoose');
const { Schema } = mongoose;

const transcriptEntrySchema = new Schema(
  {
    meeting: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true, index: true },
    speaker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    wpm: { type: Number },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

transcriptEntrySchema.index({ meeting: 1, timestamp: 1 });

module.exports = mongoose.model('TranscriptEntry', transcriptEntrySchema);

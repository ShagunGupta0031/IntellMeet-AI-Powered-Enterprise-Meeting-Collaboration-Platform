const mongoose = require('mongoose');
const { Schema } = mongoose;

// Private per-user notes for a meeting
const noteSchema = new Schema(
  {
    meeting: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, default: '' },
  },
  { timestamps: true }
);

noteSchema.index({ meeting: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Note', noteSchema);

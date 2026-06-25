const mongoose = require('mongoose');
const { Schema } = mongoose;

const actionItemSchema = new Schema(
  {
    meeting: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true, index: true },
    text: { type: String, required: true, trim: true },
    assignee: { type: Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date },
    done: { type: Boolean, default: false },
    createdBy: { type: String, enum: ['ai', 'user'], default: 'ai' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActionItem', actionItemSchema);

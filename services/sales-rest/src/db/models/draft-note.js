const { Schema } = require('mongoose');

const draftNoteSchema = new Schema({
  visitId: { type: String, unique: true },
  draft: { type: String, default: undefined },
  appendix: { type: String, default: undefined },
}, { timestamps: true });

module.exports = {
  name: 'DraftNote',
  schema: draftNoteSchema,
};

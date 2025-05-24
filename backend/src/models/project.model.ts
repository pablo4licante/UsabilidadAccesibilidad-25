import { Schema, model } from 'mongoose';

const ProjectSchema = new Schema({
  name:       { type: String, required: true },
  description:{ type: String },
  active:     { type: Boolean, default: true },
  assets:     [{ type: Schema.Types.ObjectId, ref: 'Asset' }],
  users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  owner:      { type: Schema.Types.ObjectId, ref: 'User' },
  cover_image: { type: String, required: true },
}, { timestamps: true });

export default model('Project', ProjectSchema);

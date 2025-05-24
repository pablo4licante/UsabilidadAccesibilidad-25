import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile_photo: { type: String, required: true }, 
  projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
  favorites: [{ type: Schema.Types.ObjectId, ref: 'Asset' }],
  role: { type: String, default: 'user' }
}, { timestamps: true });

export default model('User', UserSchema);

import { Schema, model, Document } from 'mongoose';

export interface Version {
  version_number: number;
  file_url: string;
  timestamp: Date;
}

export interface AssetDoc extends Document {
  owner_id: Schema.Types.ObjectId;
  project_id: Schema.Types.ObjectId;
  type: string;
  name: string;                   
  description?: string;           
  tags: string[];
  file_url: string;
  screenshot?: string;            
  versions: Version[];
  created_at: Date;
  updated_at: Date;
}

const VersionSchema = new Schema<Version>({
  version_number: { type: Number, required: true },
  file_url:       { type: String, required: true },
  timestamp:      { type: Date,   required: true },
});

const AssetSchema = new Schema<AssetDoc>({
  owner_id:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  project_id: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  type:       { type: String, required: true },
  name:       { type: String, required: true },            
  description:{ type: String, default: '' },               
  tags:       [String],
  file_url:   { type: String, required: true },
  screenshot: { type: String },                            
  versions:   [VersionSchema],
  created_at: { type: Date, required: true },
  updated_at: { type: Date, required: true },
});

export const Asset = model<AssetDoc>('Asset', AssetSchema);

// Discriminadores
const Model3DSchema = new Schema({
  format: { type: String, required: true },
  enviroment: { type: String, required: true },
  size: { type: String, required: true },
  condition: { type: String, required: true },
  polycount: { type: String, required: true },
  screenshot: { type: String, required: true }
});

const SoundSchema = new Schema({
  format: { type: String, required: true },
  sound_type: { type: String, required: true }, 
  duration: { type: Number, required: true },
  bitrate: { type: Number, required: true },
});

const ImageSchema = new Schema({
  format: { type: String, required: true },
  resolution: { type: String, required: true },
  color_depth: { type: String, required: true },
});

const VideoSchema = new Schema({
  format: { type: String, required: true },
  resolution: { type: String, required: true },
  frame_rate: { type: Number, required: true },
  duration: { type: Number, required: true }
});

const ScriptingSchema = new Schema({
    language: { type: String, required: true },
});

export const Model3D = Asset.discriminator('model3d', Model3DSchema);
export const Sound = Asset.discriminator('sound', SoundSchema);
export const Image = Asset.discriminator('image', ImageSchema);
export const Video = Asset.discriminator('video', VideoSchema);
export const Scripting = Asset.discriminator('scripting', ScriptingSchema);
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Asset, Model3D, Sound, Image, Video, Scripting } from '../models/asset.model';
import Project from '../models/project.model';

// helper para URL completas
const makeFullUrl = (req: Request, filePath: string) =>
  `${req.protocol}://${req.get('host')}${filePath}`;

// multer config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
export const upload = multer({ storage });

// GET /api/assets
export const getAssets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, tags, project_id, owner_id } = req.query;
    const q: any = {};
    if (type) q.type = type;
    if (tags) q.tags = { $all: (tags as string).split(',') };
    if (project_id) q.project_id = project_id;
    if (owner_id) q.owner_id = owner_id;

    const assets = await Asset.find(q).populate('project_id owner_id');
    const out = assets.map(a => {
      const o = a.toObject() as { _id: unknown;[key: string]: any };
      // include id string for testing convenience
      o.id = String(a._id);
      o.file_url = makeFullUrl(req, o.file_url);
      o.versions = o.versions.map((v: any) => ({
        ...v,
        file_url: makeFullUrl(req, v.file_url)
      }));
      if (o.screenshot) {
        o.screenshot = makeFullUrl(req, o.screenshot);
      }
      return o;
    });

    res.json(out);
  } catch (e) {
    res.status(500).json({ message: 'Error fetching assets', error: e });
  }
};

// GET /api/assets/:id
export const getAssetById = async (req: Request, res: Response): Promise<void> => {
  try {
    const asset = await Asset.findById(req.params.id).populate('project_id owner_id') as InstanceType<typeof Asset> | null;
    if (!asset) {
      res.status(404).json({ message: 'Asset no encontrado' });
      return;
    }
    const a = asset.toObject();
    a.id = (asset._id as string).toString();
    a.file_url = makeFullUrl(req, a.file_url);
    a.versions = a.versions.map((v: any) => ({
      ...v,
      file_url: makeFullUrl(req, v.file_url)
    }));
    if (a.screenshot) {
      a.screenshot = makeFullUrl(req, a.screenshot);
    }
    res.json(a);
  } catch (e) {
    res.status(500).json({ message: 'Error fetching asset', error: e });
  }
};

// GET /api/assets/subcategories?type=...
export const getAssetSubcategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query;
    if (!type) {
      res.status(400).json({ message: 'Asset type is required' });
      return;
    }
    const assets = await Asset.find({ type }).populate('project_id owner_id');
    const out = assets.map(a => {
      const o = a.toObject();
      // include id for tests
      o.id = (a._id as string).toString();
      o.file_url = makeFullUrl(req, o.file_url);
      if (o.screenshot) {
        o.screenshot = makeFullUrl(req, o.screenshot);
      }
      return o;
    });
    res.json(out);
  } catch (e) {
    res.status(500).json({ message: 'Error fetching subcategories', error: e });
  }
};

// POST /api/assets
export const createAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    // handle uploads
    const files = req.files as { file?: Express.Multer.File[]; screenshot?: Express.Multer.File[] };
    const mainFile = files.file && files.file[0];
    if (!mainFile) {
      res.status(400).json({ message: 'Main file is required' });
      return;
    }
    // pull metadata
    const { owner_id, project_id, type, name, description, tags, ...rest } = req.body;
    const fileUrl = `/uploads/${mainFile.filename}`;
    let screenshotPath: string | undefined;
    if (type === 'model3d') {
      const ssFile = files.screenshot && files.screenshot[0];
      if (!ssFile) {
        res.status(400).json({ message: 'Screenshot required for 3D model' });
        return;
      }
      screenshotPath = `/uploads/${ssFile.filename}`;
    }

    // prepare data and choose correct model
    const assetData: any = { owner_id, project_id, type, name, description, tags: tags?.split(',') || [], file_url: fileUrl, versions: [{ version_number: 1, file_url: fileUrl, timestamp: new Date() }], created_at: new Date(), updated_at: new Date(), ...rest };
    if (screenshotPath) assetData.screenshot = screenshotPath;

    let AssetModel;

    if (type === 'model3d') {
      AssetModel = Model3D;
    } else if (type === 'sound') {
      if (rest.duration) rest.duration = Number(rest.duration);
      if (rest.bitrate) rest.bitrate = Number(rest.bitrate);
      AssetModel = Sound;
    } else if (type === 'image') {
      AssetModel = Image;
    } else if (type === 'video') {
      AssetModel = Video;
    } else if (type === 'scripting') {
      AssetModel = Scripting;
    } else {
      AssetModel = Asset; // fallback
    }

    const newAsset = new AssetModel(assetData);
    await newAsset.save();

    if (project_id) {
      await Project.findByIdAndUpdate(project_id, { $addToSet: { assets: newAsset._id } });
    }

    res.status(201).json({ id: String(newAsset._id) });
  } catch (e) {
    res.status(500).json({ message: 'Error creando asset', error: e });
  }
};

// POST /api/assets/:id/versions
export const addAssetVersion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { version_number } = req.body;
    if (!req.file) {
      res.status(400).json({ message: 'Falta el fichero de la nueva versión' });
      return;
    }
    const asset = await Asset.findById(id);
    if (!asset) {
      res.status(404).json({ message: 'Asset no encontrado' });
      return;
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    asset.versions.push({ version_number: +version_number, file_url: fileUrl, timestamp: new Date() });
    asset.updated_at = new Date();
    await asset.save();

    const o = asset.toObject();
    o.file_url = makeFullUrl(req, o.file_url);
    o.versions = o.versions.map((v: any) => ({ ...v, file_url: makeFullUrl(req, v.file_url) }));
    res.json(o);
  } catch (e) {
    res.status(500).json({ message: 'Error añadiendo versión', error: e });
  }
};

// GET /api/assets/:id/versions
export const getAssetVersions = async (req: Request, res: Response): Promise<void> => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      res.status(404).json({ message: 'Asset no encontrado' });
      return;
    }
    const versions = asset.versions.map(v => ({
      version_number: v.version_number,
      timestamp: v.timestamp,
      file_url: makeFullUrl(req, v.file_url)
    }));
    res.json(versions);
  } catch (e) {
    res.status(500).json({ message: 'Error fetching versions', error: e });
  }
};

// DELETE /api/assets/:id/versions/:version_number
export const deleteAssetVersion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, version_number } = req.params;
    const asset = await Asset.findById(id);
    if (!asset) {
      res.status(404).json({ message: 'Asset no encontrado' });
      return;
    }
    asset.versions = asset.versions.filter(v => v.version_number !== +version_number);
    await asset.save();
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ message: 'Error borrando versión', error: e });
  }
};

// PATCH /api/assets/:id
export const updateAssetMetadata = async (req: Request, res: Response): Promise<void> => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!asset) {
      res.status(404).json({ message: 'Asset no encontrado' });
      return;
    }
    const o = asset.toObject();
    o.file_url = makeFullUrl(req, o.file_url);
    res.json(o);
  } catch (e) {
    res.status(500).json({ message: 'Error actualizando metadata', error: e });
  }
};

// DELETE /api/assets/:id
export const deleteAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1) load the asset so we know its file‐paths
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      res.status(404).json({ message: 'Asset no encontrado' });
      return;
    }

    // 2) delete physical files: main + every version
    const allPaths = [
      asset.file_url,
      ...asset.versions.map(v => v.file_url)
    ];
    for (const rel of allPaths) {
      // strip leading slash so join doesn’t break
      const relPath = rel.startsWith('/') ? rel.slice(1) : rel;
      const fullPath = path.join(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); }
        catch { /* ignore individual unlink errors */ }
      }
    }

    // 3) remove from DB
    await Asset.findByIdAndDelete(req.params.id);

    // 4) pull from parent project.assets array
    if (asset.project_id) {
      await Project.findByIdAndUpdate(
        asset.project_id,
        { $pull: { assets: asset._id } }
      );
    }

    // 5) nothing to return
    res.sendStatus(204);
  } catch (e) {
    res.status(500).json({ message: 'Error borrando asset', error: e });
  }
};

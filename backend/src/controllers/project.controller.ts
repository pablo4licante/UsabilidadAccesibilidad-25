import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Project from '../models/project.model';
import User from '../models/user.model';
import { Asset } from '../models/asset.model';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Multer config for cover images
const coverStorage = multer.diskStorage({
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
export const uploadCover = multer({ storage: coverStorage });

// Helper for full URL
const makeFullUrl = (req: Request, filePath: string) =>
  filePath ? `${req.protocol}://${req.get('host')}${filePath}` : undefined;

// CREATE PROJECT
export const createProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, description, owner_id } = req.body;
        let cover_image;
        if (req.file) {
            cover_image = `/uploads/${req.file.filename}`;
        }
        const project = new Project({ name, description, owner: owner_id, users: [owner_id], cover_image });

        await project.save();

        const user = await User.findById(owner_id);
        if (user) {
            user.projects.push(project._id);
            await user.save();
        }

        res.status(201).json({
            id: project._id.toString(),
            name: project.name,
            description: project.description,
            owner: project.owner,
            cover_image: makeFullUrl(req, project.cover_image),
            createdAt: project.createdAt,
            updatedAt: project.updatedAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating project', error });
    }
};

// UPDATE PROJECT
export const updateProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const update: any = {};
        if (typeof req.body.name === 'string') update.name = req.body.name;
        if (typeof req.body.description === 'string') update.description = req.body.description;
        if (typeof req.body.active !== 'undefined') update.active = req.body.active === 'true' || req.body.active === true;
        if (req.file) update.cover_image = `/uploads/${req.file.filename}`;

        // Debug: log update object
        // console.log('Update object:', update);

        const proj = await Project.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!proj) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        res.status(200).json({
            id: proj._id.toString(),
            name: proj.name,
            description: proj.description,
            owner: proj.owner,
            cover_image: makeFullUrl(req, proj.cover_image),
            users: proj.users,
            assets: proj.assets,
            active: proj.active,
            createdAt: proj.createdAt,
            updatedAt: proj.updatedAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating project', error });
    }
};

// GET PROJECT BY ID (add cover_image URL)
export const getProjectById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const project = await Project.findById(id).populate('owner', 'name email');
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        const out: any = project.toObject();
        out.id = project._id.toString();
        out.cover_image = makeFullUrl(req, out.cover_image);
        res.status(200).json(out);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching project', error });
    }
};

// GET ALL PROJECTS (add cover_image URL)
export const getProjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const projects = await Project.find().populate('owner', 'name email');
        const out = projects.map(p => {
            const o = p.toObject() as any;
            o.id = p._id.toString();
            o.cover_image = makeFullUrl(req, o.cover_image);
            return o;
        });
        res.status(200).json(out);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching projects', error });
    }
};

// Get users from a project
export const getUsersFromProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        // populate with correct fields and include username
        const project = await Project.findById(id).populate({ path: 'users', select: 'username email' });
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        // map users to include id field
        const users = project.users.map((u: any) => ({ id: u._id.toString(), username: u.username, email: u.email }));
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users from project', error });
    }
};

// Get assets from a project
export const getAssetsFromProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const project = await Project.findById(id).populate('assets');
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        const out = project.assets.map((a: any) => ({
            id: a._id.toString()
        }));
        res.status(200).json(out);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching assets from project', error });
    }
};

// Add user to a project
export const addUserToProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const project = await Project.findById(id);
        const user = await User.findById(userId);

        if (!project || !user) {
            res.status(404).json({ message: 'Project or user not found' });
            return;
        }

        if (!project.users.includes(new mongoose.Types.ObjectId(userId))) {
            project.users.push(userId);
            await project.save();
        }

        if (!user.projects.includes(new mongoose.Types.ObjectId(id))) {
            user.projects.push(new mongoose.Types.ObjectId(id));
            await user.save();
        }

        res.status(200).json({ message: 'User added to project successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding user to project', error });
    }
};

// Add asset to a project
export const addAssetToProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { assetId } = req.body;

        const project = await Project.findById(id);
        const asset = await Asset.findById(assetId);

        if (!project || !asset) {
            res.status(404).json({ message: 'Project or asset not found' });
        }

        if (project && !project.assets.includes(new mongoose.Types.ObjectId(assetId))) {
            project.assets.push(assetId);
            await project.save();
        }

        res.status(200).json({ message: 'Asset added to project successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding asset to project', error });
    }
};

// Delete project
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const proj = await Project.findByIdAndDelete(req.params.id);
        if (!proj) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting project', error });
    }
};

// Remove user from a project
export const removeUserFromProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, userId } = req.params;
        await Project.findByIdAndUpdate(id, { $pull: { users: userId } });
        await User.findByIdAndUpdate(userId, { $pull: { projects: id } });
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ message: 'Error removing user from project', error });
    }
};

// Remove asset from a project
export const removeAssetFromProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, assetId } = req.params;
        await Project.findByIdAndUpdate(id, { $pull: { assets: assetId } });
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ message: 'Error removing asset from project', error });
    }
};

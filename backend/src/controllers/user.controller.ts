import { Request, Response } from 'express';
import User from '../models/user.model';
import Project from '../models/project.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';


// Multer config for profile photos
const profilePhotoStorage = multer.diskStorage({
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
export const uploadProfilePhoto = multer({ storage: profilePhotoStorage });

// Helper for full URL
const makeFullUrl = (req: Request, filePath: string) =>
  filePath ? `${req.protocol}://${req.get('host')}${filePath}` : undefined;

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;
  const file = (req as any).file;

  if (!file) {
    res.status(400).json({ message: 'Profile photo is required' });
    return;
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profile_photo = `/uploads/${file.filename}`;
    const newUser = new User({ username: name, email, password: hashedPassword, profile_photo });
    await newUser.save();

    res.status(201).json({ id: newUser._id.toString(), profile_photo: makeFullUrl(req, profile_photo) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Incorrect password' });
      return;
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Successful login',
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

// Get all users
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('username email role profile_photo');
    const out = users.map(u => {
      const o = u.toObject();
      o.profile_photo = makeFullUrl(req, o.profile_photo) || '';
      return o;
    });
    res.status(200).json(out);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('username email role profile_photo');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const o = user.toObject();
    o.profile_photo = makeFullUrl(req, o.profile_photo) ?? '';
    res.status(200).json(o);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user', error: err });
  }
};

// Get user's projects
export const getUserProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate('projects', 'name description');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    // Map projects to include id field
    const projects = user.projects.map((p: any) => ({ id: p._id.toString(), name: p.name, description: p.description }));
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user projects', error: err });
  }
};

// Get user's assets
export const getUserAssets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate({
      path: 'projects',
      populate: { path: 'assets', model: 'Asset' }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const assets = user.projects.flatMap((project: any) => project.assets);
    res.status(200).json(assets);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user assets', error: err });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    let update: any = req.body;
    if ((req as any).file) {
      update.profile_photo = `/uploads/${(req as any).file.filename}`;
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) {
      res.status(404).json({ message: 'User no encontrado' });
      return;
    }
    const o = user.toObject();
    o.profile_photo = makeFullUrl(req, o.profile_photo) ?? '';
    res.json(o);
    return;
  } catch (e) {
    res.status(500).json({ message: 'Error actualizando usuario', error: e });
    return;
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(204).end();
};

export const addProjectToUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { projectId } = req.body;
  await User.findByIdAndUpdate(id, { $addToSet: { projects: projectId } });
  await Project.findByIdAndUpdate(projectId, { $addToSet: { users: id } });
  res.status(200).json({ message: 'Project added' });
};

export const removeProjectFromUser = async (req: Request, res: Response) => {
  const { id, projectId } = req.params;
  await User.findByIdAndUpdate(id, { $pull: { projects: projectId } });
  await Project.findByIdAndUpdate(projectId, { $pull: { users: id } });
  res.status(204).end();
};

// Get user's favorite assets
export const getFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate('favorites');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const favs = (user.favorites as any[]).map(a => ({ id: a._id.toString() }));
    res.status(200).json(favs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching favorites', error: err });
  }
};

// Add a favorite asset to user
export const addFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { assetId } = req.body;
    await User.findByIdAndUpdate(id, { $addToSet: { favorites: assetId } });
    res.status(200).json({ message: 'Favorite added' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding favorite', error: err });
  }
};

// Remove a favorite asset from user
export const removeFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, assetId } = req.params;
    await User.findByIdAndUpdate(id, { $pull: { favorites: assetId } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: 'Error removing favorite', error: err });
  }
};



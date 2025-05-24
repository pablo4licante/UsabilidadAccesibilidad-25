import { Router } from 'express';
import {
  register,
  login,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserProjects,
  addProjectToUser,
  removeProjectFromUser,
  getUserAssets,
  getFavorites,
  addFavorite,
  removeFavorite,
  uploadProfilePhoto
} from '../controllers/user.controller';

const router = Router();

// POST   /api/users/login
router.post('/login', login);

// POST   /api/users
// GET    /api/users
router
  .route('/')
    .post(uploadProfilePhoto.single('profile_photo'), register)
    .get(getUsers);

// GET    /api/users/:id
// PATCH  /api/users/:id
// DELETE /api/users/:id
router
  .route('/:id')
    .get(getUserById)
    .patch(uploadProfilePhoto.single('profile_photo'), updateUser)
    .delete(deleteUser);

// GET    /api/users/:id/projects
// POST   /api/users/:id/projects
router
  .route('/:id/projects')
    .get(getUserProjects)
    .post(addProjectToUser);

// DELETE /api/users/:id/projects/:projectId
router.delete('/:id/projects/:projectId', removeProjectFromUser);

// GET    /api/users/:id/assets
router.get('/:id/assets', getUserAssets);

// GET    /api/users/:id/favorites
router.get('/:id/favorites', getFavorites);
// POST   /api/users/:id/favorites
router.post('/:id/favorites', addFavorite);
// DELETE /api/users/:id/favorites/:assetId
router.delete('/:id/favorites/:assetId', removeFavorite);

export default router;

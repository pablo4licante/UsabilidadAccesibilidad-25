import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getUsersFromProject,
  addUserToProject,
  removeUserFromProject,
  getAssetsFromProject,
  addAssetToProject,
  removeAssetFromProject,
  uploadCover 
} from '../controllers/project.controller';

const router = Router();

router
  .route('/')
    .get(getProjects)
    .post(uploadCover.single('cover_image'), createProject) 

router
  .route('/:id')
    .get(getProjectById)
    .patch(uploadCover.single('cover_image'), updateProject) 
    .delete(deleteProject)

router
  .route('/:id/users')
    .get(getUsersFromProject)     // GET    /api/projects/:id/users
    .post(addUserToProject)       // POST   /api/projects/:id/users

router
  .delete('/:id/users/:userId', removeUserFromProject) // DELETE /api/projects/:id/users/:userId

router
  .route('/:id/assets')
    .get(getAssetsFromProject)    // GET    /api/projects/:id/assets
    .post(addAssetToProject)      // POST   /api/projects/:id/assets

router
  .delete('/:id/assets/:assetId', removeAssetFromProject) // DELETE /api/projects/:id/assets/:assetId

export default router;

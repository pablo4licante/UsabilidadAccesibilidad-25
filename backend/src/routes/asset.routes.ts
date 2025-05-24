import { Router } from 'express';
import {
  getAssets,
  getAssetById,
  getAssetSubcategories,
  createAsset,
  updateAssetMetadata,
  deleteAsset,
  getAssetVersions,
  addAssetVersion,
  deleteAssetVersion,
  upload
} from '../controllers/asset.controller';

const router = Router();

router  
  .route('/')
    .get(getAssets)                   // GET    /api/assets
    .post(
      upload.fields([{ name: 'file', maxCount: 1 }, { name: 'screenshot', maxCount: 1 }]),
      createAsset
    ) // POST   /api/assets (accepts file and optional screenshot)

router  
  .route('/subcategories')
    .get(getAssetSubcategories)       // GET    /api/assets/subcategories?type=...

router  
  .route('/:id')
    .get(getAssetById)               // GET    /api/assets/:id
    .patch(updateAssetMetadata)      // PATCH  /api/assets/:id
    .delete(deleteAsset)             // DELETE /api/assets/:id

router  
  .route('/:id/versions')
    .get(getAssetVersions)           // GET    /api/assets/:id/versions
    .post(upload.single('file'), addAssetVersion)  // POST   /api/assets/:id/versions

router  
  .delete('/:id/versions/:version_number', deleteAssetVersion)  // DELETE /api/assets/:id/versions/:version_number

export default router;

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';

jest.setTimeout(60000);

describe('Comprehensive API flow with Name and Description fields and all asset types', () => {
  let token: string;
  let userId: string;
  let projectId: string;
  const assetIds: Record<string, string> = {};
  const versionNumber = 2;

  beforeAll(async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/test-db', { useNewUrlParser: true, useUnifiedTopology: true } as any);
    if (mongoose.connection.db) await mongoose.connection.db.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('registers and logs in a user', async () => {
    const reg = await request(app)
      .post('/api/users')
      .field('name', 'TestUser')
      .field('email', 'test@example.com')
      .field('password', 'secret')
      .attach('profile_photo', Buffer.from('photo'), 'photo.png'); // <-- Add this line
    console.log('User registration response:', reg.body);
    expect(reg.status).toBe(201);
    userId = reg.body.id;
    expect(reg.body.profile_photo).toMatch(/\/uploads\/.*\.png$/); // <-- Check photo URL

    const login = await request(app).post('/api/users/login').send({ email: 'test@example.com', password: 'secret' });
    console.log('User login response:', login.body);
    expect(login.status).toBe(200);
    expect(login.body).toHaveProperty('token');
    token = login.body.token;
    expect(login.body.user.role).toBe('user');
  });

  it('creates a project and associates it with the user', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'ProjectX')
      .field('description', 'Project Description')
      .field('owner_id', userId)
      .attach('cover_image', Buffer.from('cover'), 'cover.png'); // <-- Add cover image
    console.log('Project creation response:', res.body);
    expect(res.status).toBe(201);
    projectId = res.body.id;
    expect(res.body.cover_image).toMatch(/\/uploads\/.*\.png$/); // <-- Check cover image URL

    const assign = await request(app)
      .post(`/api/users/${userId}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId });
    console.log('Project assignment response:', assign.body);
    expect(assign.status).toBe(200);

    const list = await request(app)
      .get(`/api/users/${userId}/projects`)
      .set('Authorization', `Bearer ${token}`);
    console.log('User projects list response:', list.body);
    expect(list.status).toBe(200);
    expect(list.body.some((p: any) => p.id === projectId)).toBe(true);

    // Verify project default 'active' status
    const getProjInit = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getProjInit.status).toBe(200);
    expect(getProjInit.body.active).toBe(true);
  });

  it('lists and modifies user via user endpoints', async () => {
    // GET all users
    const allUsers = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    console.log('List all users response:', allUsers.body);
    expect(allUsers.status).toBe(200);
    expect(allUsers.body.some((u: any) => u._id === userId || u.id === userId)).toBe(true);
    expect(allUsers.body.some((u: any) => u.role === 'user')).toBe(true);

    // GET user by id
    const getUser = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);
    console.log('Get user by id response:', getUser.body);
    expect(getUser.status).toBe(200);
    expect(getUser.body._id || getUser.body.id).toBe(userId);
    expect(getUser.body.role).toBe('user');

    // PATCH update user
    const updUser = await request(app)
      .patch(`/api/users/${userId}`)
      .field('username', 'TestUserUpdated')
      .attach('profile_photo', Buffer.from('photo2'), 'photo2.png'); // <-- Add this line
    console.log('Update user response:', updUser.body);
    expect(updUser.status).toBe(200);
    expect(updUser.body.username || updUser.body.name).toBe('TestUserUpdated');
    expect(updUser.body.profile_photo).toMatch(/\/uploads\/.*\.png$/); // <-- Check photo URL
    expect(updUser.body.role).toBe('user');

    // GET user projects
    const uProjects = await request(app)
      .get(`/api/users/${userId}/projects`)
      .set('Authorization', `Bearer ${token}`);
    console.log('Get user projects response:', uProjects.body);
    expect(uProjects.status).toBe(200);
    expect(uProjects.body.some((p: any) => p.id === projectId)).toBe(true);
  });

  it('lists and modifies project via project endpoints', async () => {
    // GET all projects
    const allProjects = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);
    console.log('List all projects response:', allProjects.body);
    expect(allProjects.status).toBe(200);
    expect(allProjects.body.some((p: any) => p._id === projectId || p.id === projectId)).toBe(true);

    // GET project by id
    const getProj = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);
    console.log('Get project by id response:', getProj.body);
    expect(getProj.status).toBe(200);
    expect(getProj.body._id || getProj.body.id).toBe(projectId);
    // Active status
    expect(getProj.body.active).toBe(true);

    // PATCH update project
    const updProj = await request(app)
      .patch(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'ProjectXUpdated')
      .field('description', 'New Desc')
      .attach('cover_image', Buffer.from('cover2'), 'cover2.png');
    console.log('Update project response:', updProj.body);
    expect(updProj.status).toBe(200);
    expect(updProj.body.name).toBe('ProjectXUpdated');
    expect(updProj.body.description).toBe('New Desc');
    expect(updProj.body.cover_image).toMatch(/\/uploads\/.*\.png$/); // <-- Check cover image URL

    // Toggle active status
    const toggle = await request(app)
      .patch(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ active: false });
    expect(toggle.status).toBe(200);
    expect(toggle.body.active).toBe(false);
    // Confirm inactive
    const getProjInactive = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getProjInactive.body.active).toBe(false);

    // GET project users
    const pUsers = await request(app)
      .get(`/api/projects/${projectId}/users`)
      .set('Authorization', `Bearer ${token}`);
    console.log('Get project users response:', pUsers.body);
    expect(pUsers.status).toBe(200);
    expect(pUsers.body.some((u: any) => u.id === userId)).toBe(true);

    // Remove user from project
    const remProjUser = await request(app)
      .delete(`/api/projects/${projectId}/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);
    console.log('Remove user from project status:', remProjUser.status);
    expect(remProjUser.status).toBe(204);
    // Confirm removal
    const pUsersAfter = await request(app)
      .get(`/api/projects/${projectId}/users`)
      .set('Authorization', `Bearer ${token}`);
    console.log('Project users after removal:', pUsersAfter.body);
    expect(pUsersAfter.status).toBe(200);
    expect(pUsersAfter.body.some((u: any) => u.id === userId)).toBe(false);

    // GET project assets (none yet)
    const pAssetsEmpty = await request(app)
      .get(`/api/projects/${projectId}/assets`)
      .set('Authorization', `Bearer ${token}`);
    console.log('Get project assets (empty) response:', pAssetsEmpty.body);
    expect(pAssetsEmpty.status).toBe(200);
    expect(Array.isArray(pAssetsEmpty.body)).toBe(true);
    expect(pAssetsEmpty.body.length).toBe(0);
  });

  const assetTypes = ['model3d', 'sound', 'image', 'video', 'scripting'];

  assetTypes.forEach(type => {
    it(`uploads, retrieves, filters, updates and deletes an asset of type ${type}`, async () => {
      const upload = request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${token}`)
        .field('owner_id', userId)
        .field('project_id', projectId)
        .field('type', type)
        .field('name', `${type}-name`)
        .field('description', `${type}-description`)
        .field('tags', 'tag1,tag2')
        .attach('file', Buffer.from('content'), `${type}.txt`);

      // Add required fields for each discriminator
      if (type === 'model3d') {
        upload
          .field('format', 'obj')
          .field('enviroment', 'indoor')
          .field('size', '10MB')
          .field('condition', 'new')
          .field('polycount', '10000')
          .attach('screenshot', Buffer.from('screenshot-data'), 'screenshot.png');
      }
      if (type === 'sound') {
        upload
          .field('format', 'wav')
          .field('sound_type', 'music') 
          .field('duration', '120')
          .field('bitrate', '320');
      }
      if (type === 'image') {
        upload
          .field('format', 'png')
          .field('resolution', '1920x1080')
          .field('color_depth', '24');
      }
      if (type === 'video') {
        upload
          .field('format', 'mp4')
          .field('resolution', '1920x1080')
          .field('frame_rate', '30')
          .field('duration', '60');
      }
      if (type === 'scripting') {
        upload
          .field('language', 'javascript');
      }

      const resUp = await upload;
      console.log(`Asset upload (${type}) response:`, resUp.body);
      expect(resUp.status).toBe(201);
      assetIds[type] = resUp.body.id;

      // Get by ID
      const getId = await request(app)
        .get(`/api/assets/${assetIds[type]}`)
        .set('Authorization', `Bearer ${token}`);
      console.log(`Get asset by ID (${type}) response:`, getId.body);
      expect(getId.status).toBe(200);
      expect(getId.body.name).toBe(`${type}-name`);
      expect(getId.body.description).toBe(`${type}-description`);
      // model3d should include screenshot URL
      if (type === 'model3d') {
        expect(getId.body.screenshot).toMatch(/uploads\/.*\.png$/);
      }

      // List all and filter by type
      const listType = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${token}`)
        .query({ type });
      console.log(`Filter assets by type (${type}) response:`, listType.body);
      expect(listType.status).toBe(200);
      expect(listType.body.some((a: any) => a.id === assetIds[type])).toBe(true);

      // List by tags
      const listTag = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${token}`)
        .query({ tags: 'tag1,tag2' });
      console.log(`Filter assets by tags (${type}) response:`, listTag.body);
      expect(listTag.status).toBe(200);
      expect(listTag.body.some((a: any) => a.id === assetIds[type])).toBe(true);

      // Get subcategories
      const sub = await request(app)
        .get('/api/assets/subcategories')
        .set('Authorization', `Bearer ${token}`)
        .query({ type });
      console.log(`Subcategories for type (${type}) response:`, sub.body);
      expect(sub.status).toBe(200);
      expect(sub.body.every((a: any) => a.type === type)).toBe(true);

      // Add version
      const addVer = await request(app)
        .post(`/api/assets/${assetIds[type]}/versions`)
        .set('Authorization', `Bearer ${token}`)
        .field('version_number', versionNumber.toString())
        .attach('file', Buffer.from('v2'), `${type}-v2.txt`);
      console.log(`Add version (${type}) response:`, addVer.body);
      expect(addVer.status).toBe(200);
      expect(addVer.body.versions.find((v: any) => v.version_number === versionNumber)).toBeTruthy();

      // List versions
      const verList = await request(app)
        .get(`/api/assets/${assetIds[type]}/versions`)
        .set('Authorization', `Bearer ${token}`);
      console.log(`List versions (${type}) response:`, verList.body);
      expect(verList.status).toBe(200);
      expect(verList.body.length).toBeGreaterThan(1);

      // Add a third version
      const thirdVersion = versionNumber + 1;
      const addVer3 = await request(app)
        .post(`/api/assets/${assetIds[type]}/versions`)
        .set('Authorization', `Bearer ${token}`)
        .field('version_number', thirdVersion.toString())
        .attach('file', Buffer.from('v3'), `${type}-v3.txt`);
      console.log(`Add third version (${type}) response:`, addVer3.body);
      expect(addVer3.status).toBe(200);
      // Verify versions count increased
      const verList2 = await request(app)
        .get(`/api/assets/${assetIds[type]}/versions`)
        .set('Authorization', `Bearer ${token}`);
      console.log(`List versions after third (${type}) response:`, verList2.body);
      expect(verList2.status).toBe(200);
      expect(verList2.body.length).toBeGreaterThanOrEqual(3);

      // Delete version
      const delVer = await request(app)
        .delete(`/api/assets/${assetIds[type]}/versions/${versionNumber}`)
        .set('Authorization', `Bearer ${token}`);
      console.log(`Delete version (${type}) status:`, delVer.status);
      expect(delVer.status).toBe(204);
      // Delete third version
      const delVer3 = await request(app)
        .delete(`/api/assets/${assetIds[type]}/versions/${thirdVersion}`)
        .set('Authorization', `Bearer ${token}`);
      console.log(`Delete third version (${type}) status:`, delVer3.status);
      expect(delVer3.status).toBe(204);

      // Update metadata
      const upd = await request(app)
        .patch(`/api/assets/${assetIds[type]}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `${type}-new`, description: `${type}-desc-new`, tags: ['x','y'] });
      console.log(`Update asset metadata (${type}) response:`, upd.body);
      expect(upd.status).toBe(200);
      expect(upd.body.name).toBe(`${type}-new`);
      expect(upd.body.description).toBe(`${type}-desc-new`);
      expect(upd.body.tags).toEqual(['x','y']);

      // Link this asset to the project
      const linkRes = await request(app)
        .post(`/api/projects/${projectId}/assets`)
        .set('Authorization', `Bearer ${token}`)
        .send({ assetId: assetIds[type] });
      console.log(`Link asset (${type}) to project response:`, linkRes.body);
      expect(linkRes.status).toBe(200);

      // Test user favorites
      const favAdd = await request(app)
        .post(`/api/users/${userId}/favorites`)
        .set('Authorization', `Bearer ${token}`)
        .send({ assetId: assetIds[type] });
      expect(favAdd.status).toBe(200);
      const favList = await request(app)
        .get(`/api/users/${userId}/favorites`)
        .set('Authorization', `Bearer ${token}`);
      expect(favList.status).toBe(200);
      expect(favList.body.some((a: any) => a.id === assetIds[type])).toBe(true);
      const favRem = await request(app)
        .delete(`/api/users/${userId}/favorites/${assetIds[type]}`)
        .set('Authorization', `Bearer ${token}`);
      expect(favRem.status).toBe(204);
      const favListAfter = await request(app)
        .get(`/api/users/${userId}/favorites`)
        .set('Authorization', `Bearer ${token}`);
      expect(favListAfter.body.some((a: any) => a.id === assetIds[type])).toBe(false);

      // Remove asset from project
      const remAsset = await request(app)
        .delete(`/api/projects/${projectId}/assets/${assetIds[type]}`)
        .set('Authorization', `Bearer ${token}`);
      console.log(`Remove asset (${type}) from project status:`, remAsset.status);
      expect(remAsset.status).toBe(204);
      // Confirm removal
      const projAssetsAfter = await request(app)
        .get(`/api/projects/${projectId}/assets`)
        .set('Authorization', `Bearer ${token}`);
      console.log(`Project assets after removal (${type}):`, projAssetsAfter.body);
      expect(projAssetsAfter.status).toBe(200);
      expect(projAssetsAfter.body.some((a: any) => a.id === assetIds[type])).toBe(false);

      // Delete asset
      const del = await request(app)
        .delete(`/api/assets/${assetIds[type]}`)
        .set('Authorization', `Bearer ${token}`);
      console.log(`Delete asset (${type}) status:`, del.status);
      expect(del.status).toBe(204);
    });
  });

  it('deletes project and user at end', async () => {
    const delProj = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);
    console.log('Delete project status:', delProj.status);
    expect(delProj.status).toBe(204);

    const delUser = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);
    console.log('Delete user status:', delUser.status);
    expect(delUser.status).toBe(204);
  });
});
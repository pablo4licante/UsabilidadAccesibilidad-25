# API Overview

Este documento describe los endpoints RESTful para gestionar **Users**, **Projects** y **Assets**.

---

## Users API  
Base URL: `/api/users`

- **POST** `/login`  
  Autentica un usuario y retorna un JWT.  
  Request Body:  
  ```json
  { "email": "user@example.com", "password": "secret" }
  ```  
  Response 200:  
  ```json
  {
    "message": "Login successful",
    "user": { "id": "...", "username": "...", "email": "...", "role": "user" },
    "token": "..."
  }
  ```

- **POST** `/`  
  Registra un nuevo usuario.  
  Content-Type: `multipart/form-data`  
  Form fields:  
  - `name`: string  
  - `email`: string  
  - `password`: string  
  - `profile_photo`: archivo (requerido)  
  Response 201:  
  ```json
  {
    "id": "...",
    "username": "New User",
    "email": "new@example.com",
    "role": "user",
    "profile_photo": "http://host/uploads/photo.png",
    "createdAt": "...",
    "updatedAt": "..."
  }
  ```

- **GET** `/`  
  Lista todos los usuarios.  
  Response 200:  
  ```json
  [
    { "id": "...", "username": "...", "email": "...", "role": "user", "profile_photo": "http://host/uploads/photo.png", "createdAt": "...", "updatedAt": "..." }
  ]
  ```

- **GET** `/:id`  
  Obtiene un usuario por ID.  
  Response 200:  
  ```json
  { "id": "...", "username": "...", "email": "...", "role": "user", "profile_photo": "http://host/uploads/photo.png", "createdAt": "...", "updatedAt": "..." }
  ```

- **PATCH** `/:id`  
  Actualiza datos de un usuario.  
  Content-Type: `multipart/form-data`  
  Form fields (ej.):  
  - `username`: string  
  - `profile_photo`: archivo (opcional, reemplaza la anterior)  
  Response 200:  
  ```json
  { "id": "...", "username": "updatedName", "email": "...", "role": "user", "profile_photo": "http://host/uploads/photo.png", "createdAt": "...", "updatedAt": "..." }
  ```

- **DELETE** `/:id`  
  Elimina un usuario.  
  Response 204: _No Content_

- **GET** `/:id/projects`  
  Lista proyectos asociados a un usuario.  
  Response 200:  
  ```json
  [
    { "id": "...", "name": "...", "description": "...", "owner": "...", "createdAt": "...", "updatedAt": "...", "active": true }
  ]
  ```
  React TSX snippet:
  ```tsx
  import React, { useEffect, useState } from 'react';

  interface Project {
    id: string;
    name: string;
    description: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
  }

  interface UserProjectsProps {
    userId: string;
    token: string;
  }

  const UserProjects: React.FC<UserProjectsProps> = ({ userId, token }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      setLoading(true);
      fetch(`/api/users/${userId}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setProjects(data))
        .catch(() => setError('Error loading projects'))
        .finally(() => setLoading(false));
    }, [userId, token]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
      <ul>
        {projects.map(p => (
          <li key={p.id}>
            <strong>{p.name}</strong> - {p.description} ({p.active ? 'Activo' : 'Inactivo'})
          </li>
        ))}
      </ul>
    );
  };

  export default UserProjects;
  ```

- **POST** `/:id/projects`  
  Añade un proyecto al usuario.  
  Request Body:  
  ```json
  { "projectId": "..." }
  ```  
  Response 200:  
  ```json
  { "message": "Project added to user successfully" }
  ```
  React TSX snippet:
  ```tsx
  import React, { useState } from 'react';

  interface AddUserProjectProps {
    userId: string;
    projectId: string;
    token: string;
    onAdded: () => void;
  }

  const AddUserProject: React.FC<AddUserProjectProps> = ({ userId, projectId, token, onAdded }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAdd = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetch(`/api/users/${userId}/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ projectId })
        });
        onAdded();
      } catch {
        setError('Error adding project');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div>
        <button onClick={handleAdd} disabled={loading}>
          {loading ? 'Adding...' : 'Add Project'}
        </button>
        {error && <span style={{ color: 'red' }}>{error}</span>}
      </div>
    );
  };

  export default AddUserProject;
  ```

- **DELETE** `/:id/projects/:projectId`  
  Quita un proyecto del usuario.  
  Response 204: _No Content_
  React TSX snippet:
  ```tsx
  import React from 'react';

  interface RemoveUserProjectProps {
    userId: string;
    projectId: string;
    token: string;
    onRemoved: () => void;
  }

  const RemoveUserProject: React.FC<RemoveUserProjectProps> = ({ userId, projectId, token, onRemoved }) => {
    const handleRemove = async () => {
      await fetch(`/api/users/${userId}/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      onRemoved();
    };

    return <button onClick={handleRemove}>Remove Project</button>;
  };

  export default RemoveUserProject;
  ```

- **GET** `/:id/assets`  
  Lista todos los assets de los proyectos del usuario.  
  Response 200:  
  ```json
  [
    {
      "id": "...",
      "type": "...",
      "tags": ["..."],
      "file_url": "...",
      "versions": [
        { "version_number": 1, "timestamp": "...", "file_url": "..." }
      ],
      "project_id": "...",
      "owner_id": "..."
    }
  ]
  ```
  React TSX snippet:
  ```tsx
  import React, { useEffect, useState } from 'react';

  interface Asset {
    id: string;
    name: string;
    type: string;
    file_url: string;
  }

  interface UserAssetsProps {
    userId: string;
    token: string;
  }

  const UserAssets: React.FC<UserAssetsProps> = ({ userId, token }) => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      setLoading(true);
      fetch(`/api/users/${userId}/assets`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setAssets(data))
        .catch(() => setError('Error loading assets'))
        .finally(() => setLoading(false));
    }, [userId, token]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
      <ul>
        {assets.map(a => (
          <li key={a.id}>
            <strong>{a.name}</strong> ({a.type})<br />
            <a href={a.file_url} target="_blank" rel="noopener noreferrer">Descargar</a>
          </li>
        ))}
      </ul>
    );
  };

  export default UserAssets;
  ```

---

## Projects API  
Base URL: `/api/projects`

- **POST** `/`  
  Crea un nuevo proyecto.  
  Content-Type: `multipart/form-data`  
  Form fields:  
  - `name`: string  
  - `description`: string  
  - `owner_id`: string  
  - `cover_image`: archivo (opcional pero recomendado)  
  Response 201:  
  ```json
  {
    "id": "...",
    "name": "Project Name",
    "description": "Desc",
    "owner": "...",
    "cover_image": "http://host/uploads/cover.png",
    "createdAt": "...",
    "updatedAt": "..."
  }
  ```
  React TSX snippet:
  ```tsx
  import React, { useState, ChangeEvent, FormEvent } from 'react';

  interface ProjectUploadFormProps {
    token: string;
    onCreated?: (project: any) => void;
  }

  const ProjectUploadForm: React.FC<ProjectUploadFormProps> = ({ token, onCreated }) => {
    const [file, setFile] = useState<File | null>(null);
    const [fields, setFields] = useState({ name: '', description: '', owner_id: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) setFile(e.target.files[0]);
    };

    const handleInput = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFields({ ...fields, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      const fd = new FormData();
      Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('cover_image', file);
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd
        });
        const data = await res.json();
        if (res.ok) {
          onCreated?.(data);
        } else {
          setError(data.message || 'Error creating project');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={fields.name} onChange={handleInput} required />
        <textarea name="description" placeholder="Description" value={fields.description} onChange={handleInput} required />
        <input name="owner_id" placeholder="Owner ID" value={fields.owner_id} onChange={handleInput} required />
        <input type="file" onChange={onChange} />
        <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Project'}</button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>
    );
  };

  export default ProjectUploadForm;
  ```

- **PATCH** `/:id`  
  Actualiza datos de un proyecto.  
  Content-Type: `multipart/form-data`  
  Form fields:  
  - cualquier campo editable  
  - `cover_image`: archivo (opcional, reemplaza la anterior)  
  Response 200:  
  ```json
  {
    "id": "...",
    "name": "...",
    "description": "...",
    "owner": "...",
    "cover_image": "http://host/uploads/cover.png",
    "users": [...],
    "assets": [...],
    "createdAt": "...",
    "updatedAt": "..."
  }
  ```
  React TSX snippet:
  ```tsx
  import React, { useState, ChangeEvent, FormEvent } from 'react';

  interface ProjectEditFormProps {
    token: string;
    project: any;
    onUpdated?: (project: any) => void;
  }

  const ProjectEditForm: React.FC<ProjectEditFormProps> = ({ token, project, onUpdated }) => {
    const [fields, setFields] = useState({ name: project.name, description: project.description });
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInput = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFields({ ...fields, [e.target.name]: e.target.value });
    };

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) setFile(e.target.files[0]);
    };

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      const fd = new FormData();
      Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('cover_image', file);
      try {
        const res = await fetch(`/api/projects/${project.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: fd
        });
        const data = await res.json();
        if (res.ok) {
          onUpdated?.(data);
        } else {
          setError(data.message || 'Error updating project');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        <input name="name" value={fields.name} onChange={handleInput} required />
        <textarea name="description" value={fields.description} onChange={handleInput} required />
        <input type="file" onChange={onChange} />
        <button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Project'}</button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>
    );
  };

  export default ProjectEditForm;
  ```

- **GET** `/`  
  Lista todos los proyectos.  
  Response 200:  
  ```json
  [
    { "id": "...", "name": "...", "description": "...", "owner": "...", "cover_image": "http://host/uploads/cover.png", "createdAt": "...", "updatedAt": "..." }
  ]
  ```
  React TSX snippet:
  ```tsx
  import React, { useEffect, useState } from 'react';

  interface Project {
    id: string;
    name: string;
    description: string;
    owner: string;
    cover_image: string;
    createdAt: string;
    updatedAt: string;
  }

  interface ProjectListProps {
    token: string;
  }

  const ProjectList: React.FC<ProjectListProps> = ({ token }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      setLoading(true);
      fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setProjects(data))
        .catch(() => setError('Error loading projects'))
        .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
      <ul>
        {projects.map(p => (
          <li key={p.id}>
            <img src={p.cover_image} alt={p.name} width={50} style={{ marginRight: 8 }} />
            <strong>{p.name}</strong> - {p.description}
          </li>
        ))}
      </ul>
    );
  };

  export default ProjectList;
  ```

- **GET** `/:id`  
  Obtiene un proyecto por ID.  
  Response 200:  
  ```json
  {
    "id": "...",
    "name": "...",
    "description": "...",
    "owner": "...",
    "cover_image": "http://host/uploads/cover.png",
    ...
  }
  ```

- **DELETE** `/:id`  
  Elimina un proyecto.  
  Response 204: _No Content_

- **GET** `/:id/users`  
  Lista usuarios asociados al proyecto.  
  Response 200:  
  ```json
  [ { "id": "...", "username": "...", "email": "..." } ]
  ```
  React TSX snippet:
  ```tsx
  import React, { useEffect, useState } from 'react';

  interface User {
    id: string;
    username: string;
    email: string;
  }

  interface ProjectUsersProps {
    projectId: string;
    token: string;
  }

  const ProjectUsers: React.FC<ProjectUsersProps> = ({ projectId, token }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      setLoading(true);
      fetch(`/api/projects/${projectId}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setUsers(data))
        .catch(() => setError('Error loading users'))
        .finally(() => setLoading(false));
    }, [projectId, token]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
      <ul>
        {users.map(u => (
          <li key={u.id}>
            <strong>{u.username}</strong> - {u.email}
          </li>
        ))}
      </ul>
    );
  };

  export default ProjectUsers;
  ```

- **POST** `/:id/users`  
  Añade un usuario al proyecto.  
  Request Body:  
  ```json
  { "userId": "..." }
  ```  
  Response 200:  
  ```json
  { "message": "User added to project successfully" }
  ```
  React TSX snippet:
  ```tsx
  import React, { useState } from 'react';

  interface AddProjectUserProps {
    projectId: string;
    userId: string;
    token: string;
    onAdded: () => void;
  }

  const AddProjectUser: React.FC<AddProjectUserProps> = ({ projectId, userId, token, onAdded }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAdd = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetch(`/api/projects/${projectId}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ userId })
        });
        onAdded();
      } catch {
        setError('Error adding user');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div>
        <button onClick={handleAdd} disabled={loading}>
          {loading ? 'Adding...' : 'Add User'}
        </button>
        {error && <span style={{ color: 'red' }}>{error}</span>}
      </div>
    );
  };

  export default AddProjectUser;
  ```

- **DELETE** `/:id/users/:userId`  
  Quita un usuario del proyecto.  
  Response 204: _No Content_
  React TSX snippet:
  ```tsx
  import React from 'react';

  interface RemoveProjectUserProps {
    projectId: string;
    userId: string;
    token: string;
    onRemoved: () => void;
  }

  const RemoveProjectUser: React.FC<RemoveProjectUserProps> = ({ projectId, userId, token, onRemoved }) => {
    const handleRemove = async () => {
      await fetch(`/api/projects/${projectId}/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      onRemoved();
    };

    return <button onClick={handleRemove}>Remove User</button>;
  };

  export default RemoveProjectUser;
  ```

- **GET** `/:id/assets`  
  Lista assets asociados al proyecto.  
  Response 200:  
  ```json
  [
    { "id": "...", "type": "...", "tags": ["..."], "file_url": "...", "versions": [...] }
  ]
  ```
  React TSX snippet:
  ```tsx
  import React, { useEffect, useState } from 'react';

  interface Asset {
    id: string;
    name: string;
    type: string;
    file_url: string;
  }

  interface ProjectAssetsProps {
    projectId: string;
    token: string;
  }

  const ProjectAssets: React.FC<ProjectAssetsProps> = ({ projectId, token }) => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      setLoading(true);
      fetch(`/api/projects/${projectId}/assets`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setAssets(data))
        .catch(() => setError('Error loading assets'))
        .finally(() => setLoading(false));
    }, [projectId, token]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
      <ul>
        {assets.map(a => (
          <li key={a.id}>
            <strong>{a.name}</strong> ({a.type})<br />
            <a href={a.file_url} target="_blank" rel="noopener noreferrer">Descargar</a>
          </li>
        ))}
      </ul>
    );
  };

  export default ProjectAssets;
  ```

- **POST** `/:id/assets`  
  Añade un asset al proyecto.  
  Request Body:  
  ```json
  { "assetId": "..." }
  ```  
  Response 200:  
  ```json
  { "message": "Asset added to project successfully" }
  ```
  React TSX snippet:
  ```tsx
  import React, { useState } from 'react';

  interface AddProjectAssetProps {
    projectId: string;
    assetId: string;
    token: string;
    onAdded: () => void;
  }

  const AddProjectAsset: React.FC<AddProjectAssetProps> = ({ projectId, assetId, token, onAdded }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAdd = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetch(`/api/projects/${projectId}/assets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ assetId })
        });
        onAdded();
      } catch {
        setError('Error adding asset');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div>
        <button onClick={handleAdd} disabled={loading}>
          {loading ? 'Adding...' : 'Add Asset'}
        </button>
        {error && <span style={{ color: 'red' }}>{error}</span>}
      </div>
    );
  };

  export default AddProjectAsset;
  ```

- **DELETE** `/:id/assets/:assetId`  
  Quita un asset del proyecto.  
  Response 204: _No Content_
  React TSX snippet:
  ```tsx
  import React from 'react';

  interface RemoveProjectAssetProps {
    projectId: string;
    assetId: string;
    token: string;
    onRemoved: () => void;
  }

  const RemoveProjectAsset: React.FC<RemoveProjectAssetProps> = ({ projectId, assetId, token, onRemoved }) => {
    const handleRemove = async () => {
      await fetch(`/api/projects/${projectId}/assets/${assetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      onRemoved();
    };

    return <button onClick={handleRemove}>Remove Asset</button>;
  };

  export default RemoveProjectAsset;
  ```

---

## Assets API  
Base URL: `/api/assets`

- **GET** `/`  
  Lista todos los assets con filtros opcionales.  
  Query Params: `type`, `tags` (coma-separated), `project_id`, `owner_id`  
  Response 200:  
  ```json
  [
    {
      "id": "...",
      "type": "...",
      "name": "...",
      "description": "...",
      "tags": ["..."],
      "file_url": "...",
      "versions": [...],
      "project_id": "...",
      "owner_id": "...",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
  ```

- **POST** `/`  
  Crea un asset.  
  Content-Type: `multipart/form-data`  
  Form fields:
  - `file`: archivo principal  
  - `owner_id`: string  
  - `project_id`: string  
  - `type`: string (`model3d`, `sound`, `image`, `video`, `scripting`)  
  - `name`: string  
  - `description`: string  
  - `tags`: string (coma-separated)  
  - **model3d:**  
    - `format`: string  
    - `enviroment`: string  
    - `size`: string  
    - `condition`: string  
    - `polycount`: string  
    - `screenshot`: archivo (campo screenshot)  
  - **sound:**  
    - `format`: string  
    - `sound_type`: string  
    - `duration`: number (en segundos)  
    - `bitrate`: number (kbps)  
  - **image:**  
    - `format`: string  
    - `resolution`: string  
    - `color_depth`: string  
  - **video:**  
    - `format`: string  
    - `resolution`: string  
    - `frame_rate`: number  
    - `duration`: number (en segundos)  
  - **scripting:**  
    - `language`: string  
  Response 201:  
  ```json
  {
    "id": "...",
    "type": "...",
    "name": "...",
    "description": "...",
    "tags": [...],
    "file_url": "...",
    "versions": [...],
    "project_id": "...",
    "owner_id": "...",
    "created_at": "...",
    "updated_at": "..."
  }
  ```
  React TSX snippet (ejemplo para subir un asset de tipo sound):
  ```tsx
  import React, { useState, ChangeEvent, FormEvent } from 'react';

  interface AssetUploadFormProps {
    token: string;
    onCreated?: (asset: any) => void;
  }

  const AssetUploadForm: React.FC<AssetUploadFormProps> = ({ token, onCreated }) => {
    const [file, setFile] = useState<File | null>(null);
    const [fields, setFields] = useState({
      name: '',
      description: '',
      owner_id: '',
      project_id: '',
      type: 'sound',
      format: '',
      sound_type: '',
      duration: '',
      bitrate: '',
      tags: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInput = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFields({ ...fields, [e.target.name]: e.target.value });
    };

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) setFile(e.target.files[0]);
    };

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      const fd = new FormData();
      Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('file', file);
      try {
        const res = await fetch('/api/assets', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd
        });
        const data = await res.json();
        if (res.ok) {
          onCreated?.(data);
        } else {
          setError(data.message || 'Error creating asset');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={fields.name} onChange={handleInput} required />
        <textarea name="description" placeholder="Description" value={fields.description} onChange={handleInput} required />
        <input name="owner_id" placeholder="Owner ID" value={fields.owner_id} onChange={handleInput} required />
        <input name="project_id" placeholder="Project ID" value={fields.project_id} onChange={handleInput} required />
        <select name="type" value={fields.type} onChange={handleInput}>
          <option value="sound">Sound</option>
          <option value="model3d">Model 3D</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="scripting">Scripting</option>
        </select>
        {/* Campos específicos para sound */}
        {fields.type === 'sound' && (
          <>
            <input name="format" placeholder="Format" value={fields.format} onChange={handleInput} required />
            <input name="sound_type" placeholder="Sound Type" value={fields.sound_type} onChange={handleInput} required />
            <input name="duration" placeholder="Duration (seconds)" value={fields.duration} onChange={handleInput} required />
            <input name="bitrate" placeholder="Bitrate (kbps)" value={fields.bitrate} onChange={handleInput} required />
          </>
        )}
        <input name="tags" placeholder="Tags (comma separated)" value={fields.tags} onChange={handleInput} />
        <input type="file" onChange={onChange} required />
        <button type="submit" disabled={loading}>{loading ? 'Uploading...' : 'Upload Asset'}</button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>
    );
  };

  export default AssetUploadForm;
  ```

- **GET** `/subcategories`  
  Filtra assets por tipo.  
  Query Param: `type`  
  Response 200:  
  ```json
  [
    {
      "id": "...",
      "type": "...",
      "tags": [...],
      "file_url": "...",
      "project_id": "...",
      "owner_id": "...",
      "created_at": "..."
    }
  ]
  ```

- **GET** `/:id`  
  Obtiene un asset por ID.  
  Response 200:  
  ```json
  {
    "id": "...",
    "type": "...",
    "name": "...",
    "description": "...",
    "tags": [...],
    "file_url": "...",
    "versions": [...],
    "project_id": "...",
    "owner_id": "...",
    "created_at": "...",
    "updated_at": "..."
  }
  ```

- **PATCH** `/:id`  
  Actualiza metadatos de un asset.  
  Request Body: campos a actualizar  
  Response 200:  
  ```json
  {
    "id": "...",
    "type": "...",
    "name": "...",
    "description": "...",
    "tags": [...],
    "file_url": "...",
    "versions": [...],
    "project_id": "...",
    "owner_id": "...",
    "created_at": "...",
    "updated_at": "..."
  }
  ```

- **DELETE** `/:id`  
  Elimina un asset.  
  Response 204: _No Content_

- **GET** `/:id/versions`  
  Lista versiones de un asset.  
  Response 200:  
  ```json
  [
    { "version_number": 1, "timestamp": "...", "file_url": "..." }
  ]
  ```

- **POST** `/:id/versions`  
  Añade una nueva versión.  
  Content-Type: `multipart/form-data`  
  Form fields:
  - `file`: archivo  
  - `version_number`: number  
  Response 200:  
  ```json
  {
    "id": "...",
    "type": "...",
    "name": "...",
    "description": "...",
    "tags": [...],
    "file_url": "...",
    "versions": [...],
    "project_id": "...",
    "owner_id": "...",
    "created_at": "...",
    "updated_at": "..."
  }
  ```

- **DELETE** `/:id/versions/:version_number`  
  Borra una versión concreta.  
  Response 204: _No Content_

---

**Notas:**
- Para assets tipo `sound`, usa el campo `sound_type` (no `type`) para el subtipo (ej: `"music"`, `"effect"`, etc).
- Para assets tipo `model3d`, el campo `screenshot` es obligatorio y debe ser un archivo.
- Todos los endpoints devuelven los códigos HTTP adecuados: `200`, `201`, `204`, `400`, `404` o `500`.
- Para rutas protegidas, añade el token JWT en el header:  
  `Authorization: Bearer <token>`
- La carpeta `/uploads` se sirve como estática en `/uploads/...`.
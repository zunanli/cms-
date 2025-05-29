# Lightweight CMS Shop

A lightweight CMS e-commerce project with SSO authentication, RBAC permission management, and large file upload support.

## Features

- SSO JWT Authentication with refresh token mechanism
- Role-Based Access Control (RBAC)
- Dynamic route registration based on user roles
- Large file upload with Web Worker support
  - Chunk-based upload
  - Pause/Resume capability
  - Progress tracking

## Tech Stack

- Frontend:
  - React 18
  - React Router 6
  - Redux Toolkit
  - Axios
  - Web Workers

- Backend:
  - Koa
  - JWT for authentication
  - File system for chunk management

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
# Start backend server
npm run start:server

# Start frontend development server
npm run start:client
```

3. Build for production:
```bash
npm run build
```

## Default Credentials

- Username: admin
- Password: admin123

## Project Structure

```
.
├── client/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── store/
│   ├── workers/
│   └── index.js
├── server/
│   ├── uploads/
│   └── index.js
├── package.json
└── webpack.config.js
```

## Security Notes

- JWT secrets should be stored in environment variables
- Password hashing should be implemented in production
- File upload validation should be added
- CORS should be properly configured
- Rate limiting should be implemented 
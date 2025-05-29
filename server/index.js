const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const multer = require('@koa/multer');
const cors = require('@koa/cors');

const app = new Koa();
const router = new Router();

// Add CORS middleware first
app.use(cors({
  origin: ctx => {
    const origin = ctx.request.header.origin;
    if (origin === 'http://localhost:3000') {
      return origin;
    }
    return false;
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
  maxAge: 86400
}));

// Add request logging middleware
app.use(async (ctx, next) => {
  console.log(`${ctx.method} ${ctx.url}`);
  console.log('Request headers:', ctx.headers);
  await next();
  console.log('Response Status:', ctx.status);
  console.log('Response headers:', ctx.response.headers);
});

// Add body parsing middleware
app.use(bodyParser({
  enableTypes: ['json', 'form'],
  formLimit: '10mb',
  jsonLimit: '10mb',
  strict: false,
  onerror: (err, ctx) => {
    console.error('Body parsing error:', err);
    ctx.throw(422, 'Body parsing failed');
  }
}));

// JWT Configuration
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, 'uploads')
});

// Mock user data (replace with database in production)
const users = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    roles: ['admin'],
    permissions: ['read', 'write', 'delete']
  }
];

// Middleware for JWT verification
const verifyToken = async (ctx, next) => {
  try {
    const token = ctx.headers.authorization?.split(' ')[1];
    if (!token) {
      ctx.status = 401;
      ctx.body = { error: 'No token provided' };
      return;
    }

    console.log('Verifying token:', token);
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    console.log('Token decoded:', decoded);
    ctx.state.user = decoded;
    await next();
  } catch (err) {
    console.error('Token verification error:', err);
    ctx.status = 401;
    ctx.body = { error: 'Invalid token' };
  }
};

// Auth routes
router.post('/api/auth/login', async (ctx) => {
  try {
    const { username, password } = ctx.request.body;
    
    console.log('Login attempt details:', {
      username,
      password,
      requestBody: ctx.request.body
    });
    
    const user = users.find(u => u.username === username && u.password === password);
    console.log('Found user:', user);

    if (!user) {
      ctx.status = 401;
      ctx.body = { error: 'Invalid credentials' };
      return;
    }

    const accessToken = jwt.sign(
      { id: user.id, roles: user.roles, permissions: user.permissions },
      JWT_ACCESS_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // 确保返回正确的数据结构
    ctx.body = {
      user: {
        id: user.id,
        username: user.username,
        roles: user.roles,
        permissions: user.permissions
      },
      accessToken,
      refreshToken
    };

    console.log('Login response:', ctx.body);
  } catch (error) {
    console.error('Login error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
});

router.post('/api/auth/refresh', async (ctx) => {
  const { refreshToken } = ctx.request.body;
  
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = users.find(u => u.id === decoded.id);

    const accessToken = jwt.sign(
      { id: user.id, roles: user.roles, permissions: user.permissions },
      JWT_ACCESS_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    ctx.body = { accessToken };
  } catch (err) {
    ctx.status = 401;
    ctx.body = { error: 'Invalid refresh token' };
  }
});

// File upload routes
router.post('/api/upload/chunk', verifyToken, upload.single('chunk'), async (ctx) => {
  try {
    console.log('Processing chunk upload:', {
      body: ctx.request.body,
      file: ctx.request.file,
      user: ctx.state.user
    });

    const { uploadId, chunkIndex, totalChunks } = ctx.request.body;
    const file = ctx.request.file;

    if (!file) {
      ctx.status = 400;
      ctx.body = { error: 'No file uploaded' };
      return;
    }

    const chunkDir = path.join(__dirname, 'uploads', uploadId);
    await fs.mkdir(chunkDir, { recursive: true });
    
    const chunkPath = path.join(chunkDir, `${chunkIndex}`);
    await fs.rename(file.path, chunkPath);

    ctx.body = { 
      success: true,
      message: `Chunk ${chunkIndex} of ${totalChunks} uploaded successfully`
    };
  } catch (error) {
    console.error('Chunk upload error:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

router.post('/api/upload/complete', verifyToken, async (ctx) => {
  try {
    console.log('Processing upload complete:', {
      body: ctx.request.body,
      user: ctx.state.user
    });

    const { uploadId, fileName } = ctx.request.body;
    if (!uploadId || !fileName) {
      ctx.status = 400;
      ctx.body = { error: 'Missing uploadId or fileName' };
      return;
    }

    const chunkDir = path.join(__dirname, 'uploads', uploadId);
    const finalPath = path.join(__dirname, 'uploads', fileName);

    // Check if chunk directory exists
    try {
      await fs.access(chunkDir);
    } catch (err) {
      ctx.status = 404;
      ctx.body = { error: 'Upload session not found' };
      return;
    }

    const chunks = await fs.readdir(chunkDir);
    const sortedChunks = chunks.sort((a, b) => parseInt(a) - parseInt(b));

    // Use synchronous writeStream
    const writeStream = fsSync.createWriteStream(finalPath);
    
    for (const chunk of sortedChunks) {
      const chunkPath = path.join(chunkDir, chunk);
      const chunkData = await fs.readFile(chunkPath);
      writeStream.write(chunkData);
    }
    
    // Convert writeStream.end to promise
    await new Promise((resolve, reject) => {
      writeStream.end((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await fs.rmdir(chunkDir, { recursive: true });

    ctx.body = { 
      success: true,
      message: 'File upload completed successfully',
      path: fileName
    };
  } catch (error) {
    console.error('Complete upload error:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Use router after all middleware
app.use(router.routes());
app.use(router.allowedMethods());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
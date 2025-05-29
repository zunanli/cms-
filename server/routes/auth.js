const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const { routePermissions } = require('../config/permissions');

const router = new Router({ prefix: '/api/auth' });

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

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

router.post('/login', async (ctx) => {
  try {
    const { username, password } = ctx.request.body;
    
    const user = users.find(u => u.username === username && u.password === password);

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
  } catch (error) {
    console.error('Login error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
});

router.post('/refresh', async (ctx) => {
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

router.get('/route-permissions', async (ctx) => {
  try {
    ctx.body = { routePermissions };
  } catch (error) {
    console.error('Error fetching route permissions:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
});

module.exports = router; 
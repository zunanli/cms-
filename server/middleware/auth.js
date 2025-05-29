const jwt = require('jsonwebtoken');
const { routePermissions } = require('../config/permissions');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';

// Middleware for JWT verification
const verifyToken = async (ctx, next) => {
  try {
    const token = ctx.headers.authorization?.split(' ')[1];
    if (!token) {
      ctx.status = 401;
      ctx.body = { error: 'No token provided' };
      return;
    }

    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    ctx.state.user = decoded;
    await next();
  } catch (err) {
    console.error('Token verification error:', err);
    ctx.status = 401;
    ctx.body = { error: 'Invalid token' };
  }
};

// Middleware for checking permissions
const checkPermissions = async (ctx, next) => {
  // 跳过不需要权限检查的路由
  const skipPaths = ['/api/auth/login', '/api/auth/refresh', '/api/auth/route-permissions'];
  if (skipPaths.includes(ctx.path)) {
    await next();
    return;
  }

  // 验证 token
  try {
    const token = ctx.headers.authorization?.split(' ')[1];
    if (!token) {
      ctx.status = 401;
      ctx.body = { error: 'No token provided' };
      return;
    }

    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    ctx.state.user = decoded;
  } catch (err) {
    ctx.status = 401;
    ctx.body = { error: 'Invalid token' };
    return;
  }

  const { roles = [], permissions = [] } = ctx.state.user;
  
  // 从路由路径获取权限配置
  const path = ctx.path.replace('/api', '');
  const routeConfig = routePermissions[path];

  if (!routeConfig) {
    console.warn(`No permission configuration found for path: ${path}`);
    // 如果没有配置权限，默认需要登录即可访问
    await next();
    return;
  }

  const { requiredRoles = [], requiredPermissions = [] } = routeConfig;

  const hasRequiredRole = requiredRoles.length === 0 || 
    requiredRoles.some(role => roles.includes(role));

  const hasRequiredPermission = requiredPermissions.length === 0 || 
    requiredPermissions.some(permission => permissions.includes(permission));

  if (!hasRequiredRole || !hasRequiredPermission) {
    ctx.status = 403;
    ctx.body = { 
      error: 'Forbidden',
      message: 'You do not have the required roles or permissions for this action',
      required: {
        roles: requiredRoles,
        permissions: requiredPermissions
      },
      current: {
        roles,
        permissions
      }
    };
    return;
  }

  await next();
};

module.exports = {
  verifyToken,
  checkPermissions
}; 
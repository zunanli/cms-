// Route permissions configuration
const routePermissions = {
  '/dashboard': {
    requiredRoles: ['admin', 'user'],
    requiredPermissions: []
  },
  '/upload': {
    requiredRoles: ['admin'],
    requiredPermissions: ['write']
  },
  '/upload/chunk': {
    requiredRoles: ['admin'],
    requiredPermissions: ['write']
  },
  '/upload/complete': {
    requiredRoles: ['admin'],
    requiredPermissions: ['write']
  }
};

module.exports = {
  routePermissions
}; 
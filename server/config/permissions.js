// Route permissions configuration
const routePermissions = {
  '/dashboard': {
    requiredRoles: ['admin', 'user'],
    requiredPermissions: ['read']
  },
  '/upload': {
    requiredRoles: ['admin'],
    requiredPermissions: ['read','write']
  },
  '/upload/chunk': {
    requiredRoles: ['admin'],
    requiredPermissions: ['read','write']
  },
  '/upload/complete': {
    requiredRoles: ['admin'],
    requiredPermissions: ['read','write']
  }
};

module.exports = {
  routePermissions
}; 
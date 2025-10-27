
// Role definitions and configurations for the application
export const ROLES = {
  PUBLIC_USER: 'public-user',
  RESEARCH_EXPERT: 'research-expert',
  ADMIN: 'admin'
};

// Role-specific configuration including display names, paths, and access controls
export const ROLE_CONFIG = {
  [ROLES.PUBLIC_USER]: {
    id: ROLES.PUBLIC_USER,
    display: 'Public User',
    dashboardPath: '/dashboard',
    allowedPaths: [
      '/dashboard',
      '/profile',
      '/settings',
      '/api/auth/me',
      '/api/ai/chats',
      '/api/ai/chat'
    ],
    nav: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'My Profile', path: '/profile' },
      { label: 'Settings', path: '/settings' }
    ]
  },
  [ROLES.RESEARCH_EXPERT]: {
    id: ROLES.RESEARCH_EXPERT,
    display: 'Research Expert',
    dashboardPath: '/dashboard',
    allowedPaths: [
      '/dashboard',
      '/research',
      '/profile',
      '/settings',
      '/api/auth/me'
    ],
    nav: [
      { label: 'Research Dashboard', path: '/dashboard' },
      { label: 'Research Projects', path: '/research' },
      { label: 'Profile', path: '/profile' },
      { label: 'Settings', path: '/settings' }
    ]
  },
  [ROLES.ADMIN]: {
    id: ROLES.ADMIN,
    display: 'Admin',
    dashboardPath: '/dashboard',
    allowedPaths: ['*'], // Admin has access to all paths
    nav: [
      { label: 'Admin Dashboard', path: '/dashboard' },
      { label: 'User Management', path: '/admin/users' },
      { label: 'Site Settings', path: '/admin/settings' }
    ]
  }
};

// Helper Functions

/**
 * Get display name for a role
 * @param {string} role - Role identifier
 * @returns {string} Human-readable role name
 */
export function getRoleDisplay(role) {
  return ROLE_CONFIG[role]?.display || role;
}

/**
 * Get dashboard path for a role
 * @param {string} role - Role identifier
 * @returns {string} Dashboard path for the role
 */
export function getDashboardPath(role) {
  return ROLE_CONFIG[role]?.dashboardPath || '/dashboard';
}

/**
 * Check if a path is accessible for a role
 * @param {string} role - Role identifier
 * @param {string} path - Path to check
 * @returns {boolean} Whether the role can access the path
 */
export function canAccessPath(role, path) {
  const config = ROLE_CONFIG[role];
  if (!config) return false;

  // Admin has access to everything
  if (role === ROLES.ADMIN) return true;

  // Check if path exactly matches or is under an allowed path
  return config.allowedPaths.some(allowedPath =>
    path === allowedPath || path.startsWith(`${allowedPath}/`)
  );
}

/**
 * Get navigation items for a role
 * @param {string} role - Role identifier
 * @returns {Array} Array of navigation items
 */
export function getNavigation(role) {
  return ROLE_CONFIG[role]?.nav || [];
}

/**
 * Get all available roles
 * @returns {Array} Array of role identifiers
 */
export function getAllRoles() {
  return Object.values(ROLES);
}

/**
 * Check if a role is valid
 * @param {string} role - Role to validate
 * @returns {boolean} Whether the role exists
 */
export function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

/**
 * Get configuration for a role
 * @param {string} role - Role identifier
 * @returns {Object|null} Role configuration object
 */
export function getRoleConfig(role) {
  return ROLE_CONFIG[role] || null;
}
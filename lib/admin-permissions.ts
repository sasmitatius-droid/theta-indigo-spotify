export type AdminPermissions = {
  manageUsers: boolean;
  managePackages: boolean;
  manageBlog: boolean;
  manageAdmins: boolean;
  manageSubscriptions: boolean;
};

export const FULL_ADMIN_PERMISSIONS: AdminPermissions = {
  manageUsers: true,
  managePackages: true,
  manageBlog: true,
  manageAdmins: true,
  manageSubscriptions: true,
};

export const DEFAULT_LIMITED_PERMISSIONS: AdminPermissions = {
  manageUsers: false,
  managePackages: false,
  manageBlog: true,
  manageAdmins: false,
  manageSubscriptions: false,
};

export function canAccessTab(tab: string, perms: AdminPermissions): boolean {
  switch (tab) {
    case 'stats':
      return perms.manageUsers || perms.manageSubscriptions || perms.manageBlog;
    case 'users':
      return perms.manageUsers || perms.manageSubscriptions;
    case 'packages':
      return perms.managePackages;
    case 'blog':
    case 'media-ai':
      return perms.manageBlog;
    case 'admins':
      return perms.manageAdmins;
    default:
      return false;
  }
}

/**
 * Client-side role utility.
 * userRoles is the array of roles for the current user (fetched from user_roles table).
 * Admin always passes every check.
 */

export type UserRole = 'admin' | 'store_manager' | 'receptionist' | 'optician' | 'accountant' | 'doctor'

/** Returns true if the user has the given role, OR is an admin. */
export function hasRole(userRoles: string[], role: UserRole): boolean {
  return userRoles.includes('admin') || userRoles.includes(role)
}

/** Returns true if the user is an admin. */
export function isAdmin(userRoles: string[]): boolean {
  return userRoles.includes('admin')
}

/** Returns a display-friendly label for a role. */
export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Admin',
    store_manager: 'Store Manager',
    receptionist: 'Receptionist',
    optician: 'Optician',
    accountant: 'Accountant',
    doctor: 'Doctor',
  }
  return labels[role] ?? role
}

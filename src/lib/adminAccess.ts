export type AdminPermission =
  | "manage_users"
  | "moderation"
  | "reports"
  | "verification"
  | "withdrawals"
  | "analytics"
  | "*";

export function canAdminAccess(
  permissions: string[] | undefined,
  permission: AdminPermission,
  role?: string | null,
) {
  if (role === "super-admin") return true;
  if (!role) return false;
  const list = permissions || [];
  return list.includes("*") || list.includes(permission);
}


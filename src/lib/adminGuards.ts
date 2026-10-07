export interface AdminSessionLike {
  adminRole?: "super-admin" | "admin" | null;
  adminPermissions?: string[] | null;
}

export function isAdminUser(user: AdminSessionLike | null | undefined) {
  return Boolean(user?.adminRole);
}

export function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function getAdminRedirect(
  pathname: string,
  loading: boolean,
  user: AdminSessionLike | null | undefined,
) {
  if (!isAdminPath(pathname)) return null;
  if (loading) return null;
  if (!user) {
    return `/login?redirectTo=${encodeURIComponent(pathname)}`;
  }
  if (!isAdminUser(user)) {
    return "/dashboard";
  }
  return null;
}

export function shouldFetchAdminData(
  loading: boolean,
  user: AdminSessionLike | null | undefined,
  canAccess: boolean,
) {
  return !loading && isAdminUser(user) && canAccess;
}

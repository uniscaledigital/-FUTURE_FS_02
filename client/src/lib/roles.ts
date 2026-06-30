export type AppRole = "admin" | "member" | "viewer";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  member: "Sales Executive",
  viewer: "Viewer",
};

export const ROLE_VARIANTS: Record<AppRole, "admin" | "sales" | "viewer"> = {
  admin: "admin",
  member: "sales",
  viewer: "viewer",
};

export const ROLE_ICONS: Record<AppRole, string> = {
  admin: "👑",
  member: "👨‍💼",
  viewer: "👀",
};

export function getRoleLabel(role: AppRole | null | undefined) {
  if (!role) return "Unknown";
  return ROLE_LABELS[role] ?? "Viewer";
}

export function getRoleVariant(role: AppRole | null | undefined) {
  if (!role) return "viewer";
  return ROLE_VARIANTS[role] ?? "viewer";
}

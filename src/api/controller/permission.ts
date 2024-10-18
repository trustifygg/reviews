import { PermissionsBitField, PermissionsString } from "discord.js";

export const hasPermission = (permissions: PermissionsBitField, permission: PermissionsString) => {
  const perms = new PermissionsBitField(permissions);
  return perms.has(permission);
}
export const AUTH_LOGIN_PATH = "/login";
export const AUTH_HOME_PATH = "/";

export function isPublicPath(pathname: string) {
  return pathname === AUTH_LOGIN_PATH || pathname.startsWith("/_next");
}

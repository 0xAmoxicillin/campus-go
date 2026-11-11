// M1 约定：JWT 仅存于内存（不落 localStorage，降低 XSS 窃取面）。
// 真实后端实现接口级 JwtAuthGuard + RolesGuard 才是安全边界；
// 此处的存储只服务于前端路由守卫的体验层分流。

const tokenStore = {
  accessToken: '' as string,
  refreshToken: '' as string,
};

export function setTokens(accessToken: string, refreshToken: string): void {
  tokenStore.accessToken = accessToken;
  tokenStore.refreshToken = refreshToken;
}

export function getAccessToken(): string {
  return tokenStore.accessToken;
}

export function getRefreshToken(): string {
  return tokenStore.refreshToken;
}

export function clearTokens(): void {
  tokenStore.accessToken = '';
  tokenStore.refreshToken = '';
}

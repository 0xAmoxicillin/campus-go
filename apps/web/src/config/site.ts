/**
 * 站点品牌与文案配置（「校园行 CampusGo」展示模板 · 拿来即套用）。
 *
 * 改这里就能把整套官网 / 后台套用到你自己的项目：
 * - name / nameEn / slogan / footerNote：站点标识与标语
 * - contactEmail：页脚联系邮箱
 * - nav：官网公开导航（Navbar / Footer 共用）
 * - copyright：页脚版权行
 *
 * 注意：仅做「展示模板」层面的品牌替换；业务数据（活动/资讯/用户）仍来自
 * mock adapter 或真实后端接口，不在此处硬编码。
 */

export interface SiteNavItem {
  to: string;
  label: string;
}

export const siteConfig = {
  /** 中文品牌名（如「校园行」）。 */
  name: '校园行',
  /** 英文 / 品牌后缀（如「CampusGo」），与 name 拼成完整 logo 文案。 */
  nameEn: 'CampusGo',
  /** 首页 Hero / 页脚 slogan。 */
  slogan: '把每一次出发都变成故事。发现活动、报名同行、记录你的校园轨迹。',
  /** 页脚联系邮箱。 */
  contactEmail: 'hello@campusgo.local',
  /** 页脚版权行。 */
  copyright: '© 2026 校园行 CampusGo · 私有仓库演示',
  /** 官网公开导航（Navbar + Footer 共用）。 */
  nav: [
    { to: '/', label: '首页' },
    { to: '/about', label: '关于校园行' },
    { to: '/activities', label: '活动·行程' },
    { to: '/posts', label: '资讯·动态' },
    { to: '/join', label: '加入我们' },
  ] as SiteNavItem[],
} as const;

/** 完整品牌文案（中文 + 英文），便于 logo 拼接。 */
export function brandText(): string {
  return `${siteConfig.name} ${siteConfig.nameEn}`;
}

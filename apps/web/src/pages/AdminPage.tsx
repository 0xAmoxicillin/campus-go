import { useEffect, useState } from 'react';
import { Container, Section } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader, EmptyState, Pagination } from '@/components/common/PageHeader';
import { ShieldIcon, UserIcon, CalendarIcon, MailIcon } from '@/components/icons';
import { adminApi } from '@/api';
import { ApiError } from '@/api/errors';
import { Role, UserStatus, type ActivityView, type PostView, type UserView } from '@/contracts/api-contract';
import { toast } from '@/components/ui/Toast';

const PAGE_SIZE = 8;

export function AdminPage() {
  const [users, setUsers] = useState<UserView[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [activs, setActivs] = useState<ActivityView[]>([]);
  const [posts, setPosts] = useState<PostView[]>([]);
  const [loading, setLoading] = useState(true);
  // 演示用「越权错误样本」触发开关（模拟 USER 调用 /api/admin/** 得到的 40300）。
  const [forbiddenSample, setForbiddenSample] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi.listUsers({ page: userPage, pageSize: PAGE_SIZE }),
      adminApi.listActivities({ pageSize: 5 }),
      adminApi.listPosts({ pageSize: 5 }),
    ])
      .then(([u, a, p]) => {
        setUsers(u.items);
        setUserTotal(u.total);
        setActivs(a.items);
        setPosts(p.items);
      })
      .catch((e) => {
        // 若当前 token 非 ADMIN 或过期，后端（或 mock）返回 401/403，前端仅体验层提示。
        const msg = e instanceof ApiError ? e.message : '加载后台失败';
        toast(msg, 'error');
        if (e instanceof ApiError && e.isForbidden()) setForbiddenSample(true);
      })
      .finally(() => setLoading(false));
  }, [userPage]);

  async function toggleStatus(u: UserView) {
    try {
      await adminApi.updateUser(u.id, { status: u.status === UserStatus.ACTIVE ? UserStatus.DISABLED : UserStatus.ACTIVE });
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, status: x.status === UserStatus.ACTIVE ? UserStatus.DISABLED : UserStatus.ACTIVE } : x)));
      toast('已更新用户状态', 'success');
    } catch (e) {
      toast(e instanceof ApiError ? e.message : '更新失败', 'error');
    }
  }

  if (loading) return <Section><Container><EmptyState title="加载中…" /></Container></Section>;

  return (
    <>
      <PageHeader title="管理员控制台" subtitle="用户管理 + 内容（活动 / 资讯）CRUD 后台骨架。真实鉴权与越权拦截由后端接口级 Guards 兜底。" />
      <Section>
        <Container className="space-y-10">
          {forbiddenSample && (
            <div className="rounded-xl border border-accent-500/40 bg-accent-500/10 px-4 py-3 text-sm text-accent-600">
              越权错误样本：你以非 ADMIN 身份访问 /api/admin/**，后端返回 <code>code=40300</code> / HTTP 403（前端路由守卫仅做体验分流）。
            </div>
          )}

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <ShieldIcon className="text-brand-700" />
              <h2 className="text-xl font-bold text-ink">用户管理</h2>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-ink-faint">
                  <tr className="border-b border-line">
                    <th className="py-2 pr-4">昵称</th>
                    <th className="py-2 pr-4">邮箱</th>
                    <th className="py-2 pr-4">角色</th>
                    <th className="py-2 pr-4">状态</th>
                    <th className="py-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-line/60">
                      <td className="py-2.5 pr-4 text-ink">{u.name}</td>
                      <td className="py-2.5 pr-4 text-ink-soft">{u.email}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-2xs ${u.role === Role.ADMIN ? 'bg-brand-50 text-brand-700' : 'bg-surface-soft text-ink-faint'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-2xs ${u.status === UserStatus.ACTIVE ? 'bg-teal-500/15 text-teal-600' : 'bg-accent-500/15 text-accent-600'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <Button size="sm" variant="outline" onClick={() => toggleStatus(u)}>
                          {u.status === UserStatus.ACTIVE ? '停用' : '启用'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={userPage} total={userTotal} pageSize={PAGE_SIZE} onChange={setUserPage} />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <CalendarIcon className="text-brand-700" />
                <h2 className="text-xl font-bold text-ink">活动管理</h2>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {activs.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-ink-soft">
                    <UserIcon width={14} height={14} className="text-ink-faint" />
                    {a.title} <span className="text-2xs text-ink-faint">· {a.status}</span>
                  </li>
                ))}
              </ul>
              <Button size="sm" variant="outline" className="mt-4" onClick={() => toast('M2 接入真实创建接口', 'info')}>
                新建活动
              </Button>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2">
                <MailIcon className="text-brand-700" />
                <h2 className="text-xl font-bold text-ink">资讯管理</h2>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {posts.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 text-ink-soft">
                    <MailIcon width={14} height={14} className="text-ink-faint" />
                    {p.title} <span className="text-2xs text-ink-faint">· {p.status}</span>
                  </li>
                ))}
              </ul>
              <Button size="sm" variant="outline" className="mt-4" onClick={() => toast('M2 接入真实创建接口', 'info')}>
                新建资讯
              </Button>
            </Card>
          </div>

          <p className="text-2xs text-ink-faint">共 {users.length} 位用户载入（分页演示）。数据来自 mock adapter，字段严格遵循 docs/api-contract-v0.1.md。</p>
        </Container>
      </Section>
    </>
  );
}

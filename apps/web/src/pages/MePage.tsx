import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Container, Section } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { UserIcon } from '@/components/icons';
import { usersApi } from '@/api';
import { useAuthStore } from '@/store/useAuthStore';
import { updateMeSchema, type UpdateMeValues } from '@/lib/validators';
import { toast } from '@/components/ui/Toast';
import { ApiError } from '@/api/errors';
import { Role, type UserView } from '@/contracts/api-contract';
import { formatDate } from '@/lib/format';

export function MePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [fresh, setFresh] = useState<UserView | null>(user);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateMeValues>({
    resolver: zodResolver(updateMeSchema),
    values: { name: fresh?.name ?? '' },
  });

  useEffect(() => {
    usersApi.getMe().then(setFresh).catch(() => {});
  }, []);

  async function onSubmit(values: UpdateMeValues) {
    setSaving(true);
    try {
      const updated = await usersApi.updateMe({ name: values.name });
      setFresh(updated);
      useAuthStore.setState({ user: updated });
      toast('资料已更新', 'success');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : '更新失败';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="我的资料" subtitle="修改你的昵称（邮箱 / 角色 / 状态不可在此更改）。" />
      <Section>
        <Container className="max-w-xl">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-gradient text-white">
                <UserIcon />
              </span>
              <div>
                <p className="text-lg font-semibold text-ink">{fresh?.name}</p>
                <p className="text-sm text-ink-faint">{fresh?.email}</p>
              </div>
              <span className="ml-auto rounded-full bg-brand-50 px-3 py-1 text-2xs font-medium text-brand-700">
                {fresh?.role === Role.ADMIN ? '管理员' : '普通用户'}
              </span>
            </div>
            {fresh && (
              <p className="mt-4 text-2xs text-ink-faint">注册于 {formatDate(fresh.createdAt)}</p>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Input label="昵称" error={errors.name?.message} {...register('name')} />
              <Button type="submit" disabled={saving}>{saving ? '保存中…' : '保存修改'}</Button>
            </form>

            <div className="mt-6 border-t border-line/60 pt-4">
              <Button variant="ghost" size="sm" onClick={() => logout()}>退出登录</Button>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}

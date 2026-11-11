import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MailIcon, LockIcon, UserIcon } from '@/components/icons';
import { registerSchema, type RegisterValues } from '@/lib/validators';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/components/ui/Toast';
import { ApiError } from '@/api/errors';

export function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((s) => s.register);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterValues) {
    setSubmitting(true);
    try {
      const user = await registerUser(values.email, values.password, values.name);
      toast(`注册成功，欢迎你，${user.name}！`, 'success');
      navigate('/me', { replace: true });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : '注册失败';
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-extrabold text-ink">注册校园行</h1>
        <p className="mt-2 text-sm text-ink-soft">注册即成为普通用户（USER）。管理员仅由服务端种子创建。</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label="昵称"
            autoComplete="nickname"
            placeholder="你的名字"
            icon={<UserIcon width={18} height={18} />}
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="邮箱"
            type="email"
            autoComplete="email"
            placeholder="you@campusgo.local"
            icon={<MailIcon width={18} height={18} />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="密码"
            type="password"
            autoComplete="new-password"
            placeholder="≥8 位，含大小写与数字"
            icon={<LockIcon width={18} height={18} />}
            hint="至少 8 位，且包含大写字母、小写字母与数字"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? '注册中…' : '注册'}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-ink-soft">
          已有账号？{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">去登录</Link>
        </p>
        <p className="mt-3 rounded-lg bg-surface-soft px-3 py-2 text-2xs text-ink-faint">
          ⚠️ 安全红线：即便请求体携带 role 也会被忽略，注册一律为 USER（由后端硬编码，前端仅作体验提示）。
        </p>
      </Card>
    </Container>
  );
}

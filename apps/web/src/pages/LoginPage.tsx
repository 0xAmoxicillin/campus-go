import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MailIcon, LockIcon } from '@/components/icons';
import { loginSchema, type LoginValues } from '@/lib/validators';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/components/ui/Toast';
import { ApiError } from '@/api/errors';
import { Role } from '@/contracts/api-contract';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const from = (location.state as { from?: string } | null)?.from;

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    try {
      const user = await login(values.email, values.password);
      toast(`欢迎回来，${user.name}`, 'success');
      // 角色分流（体验层；安全边界在后端接口级 Guards）。
      navigate(from ?? (user.role === Role.ADMIN ? '/admin' : '/me'), { replace: true });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : '登录失败';
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-extrabold text-ink">登录校园行</h1>
        <p className="mt-2 text-sm text-ink-soft">使用你的账号继续。管理员将进入控制台。</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
            autoComplete="current-password"
            placeholder="••••••••"
            icon={<LockIcon width={18} height={18} />}
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? '登录中…' : '登录'}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-ink-soft">
          还没有账号？{' '}
          <Link to="/register" className="font-medium text-brand-700 hover:underline">立即注册</Link>
        </p>
        <p className="mt-3 rounded-lg bg-surface-soft px-3 py-2 text-2xs text-ink-faint">
          M1 演示账号（mock）：admin@campusgo.local / 见 README；alice@campusgo.local / 见 README。
          前端路由守卫仅做体验分流，接口级越权拦截由后端 JwtAuthGuard + RolesGuard 兜底。
        </p>
      </Card>
    </Container>
  );
}

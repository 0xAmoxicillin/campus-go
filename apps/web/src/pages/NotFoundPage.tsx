import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-6xl font-extrabold text-gradient">404</div>
      <p className="mt-3 text-ink-soft">这个页面走丢了，我们帮你回到起点。</p>
      <Link to="/" className="mt-6"><Button>返回首页</Button></Link>
    </Container>
  );
}

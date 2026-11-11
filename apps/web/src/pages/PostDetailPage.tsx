import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container, Section } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/PageHeader';
import { postsApi } from '@/api';
import type { PostView } from '@/contracts/api-contract';
import { formatDate } from '@/lib/format';

export function PostDetailPage() {
  const { id = '' } = useParams();
  const [post, setPost] = useState<PostView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    postsApi
      .get(id)
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Section><Container><EmptyState title="加载中…" /></Container></Section>;
  if (!post)
    return (
      <Section>
        <Container>
          <EmptyState title="资讯不存在或已下架" />
          <div className="mt-6 text-center"><Link to="/posts"><Button variant="outline">返回资讯列表</Button></Link></div>
        </Container>
      </Section>
    );

  return (
    <Section>
      <Container className="max-w-3xl">
        <Link to="/posts" className="text-sm text-brand-700 hover:underline">← 资讯列表</Link>
        <img src={post.coverUrl} alt={post.title} className="mt-4 h-60 w-full rounded-xl object-cover shadow-depth-2" />
        <h1 className="mt-6 text-3xl font-extrabold text-ink">{post.title}</h1>
        {post.publishedAt && <p className="mt-2 text-sm text-ink-faint">{formatDate(post.publishedAt)}</p>}
        <Card className="mt-6 whitespace-pre-line p-6 text-ink-soft">{post.content}</Card>
      </Container>
    </Section>
  );
}

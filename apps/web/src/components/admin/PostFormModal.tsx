import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ImageIcon } from '@/components/icons';
import { PostStatus, type PostView } from '@/contracts/api-contract';
import { postSchema, type PostFormValues, postStatusLabel } from '@/lib/adminForms';

interface PostFormModalProps {
  open: boolean;
  /** 传入则为编辑模式，否则为新建。 */
  post?: PostView | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: PostFormValues) => void;
}

const statusOptions = (Object.values(PostStatus) as PostStatus[]).map((s) => ({
  value: s,
  label: postStatusLabel[s],
}));

export function PostFormModal({ open, post, submitting, onClose, onSubmit }: PostFormModalProps) {
  const isEdit = !!post;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    values: {
      title: post?.title ?? '',
      summary: post?.summary ?? '',
      content: post?.content ?? '',
      coverUrl: post?.coverUrl ?? '',
      status: post?.status ?? PostStatus.DRAFT,
    },
  });

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? '编辑资讯' : '新建资讯'}
      footer={
        <>
          <Button variant="ghost" size="sm" type="button" onClick={handleClose}>
            取消
          </Button>
          <Button variant="primary" size="sm" type="submit" form="post-form" disabled={submitting}>
            {submitting ? '保存中…' : isEdit ? '保存修改' : '创建资讯'}
          </Button>
        </>
      }
    >
      <form id="post-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="标题"
          placeholder="例如：校园行上线啦"
          error={errors.title?.message}
          {...register('title')}
        />
        <Textarea
          label="摘要"
          rows={2}
          placeholder="一句话简介"
          error={errors.summary?.message}
          {...register('summary')}
        />
        <Textarea
          label="正文"
          rows={5}
          placeholder="资讯详情，支持换行"
          error={errors.content?.message}
          {...register('content')}
        />
        <Input
          label="封面图（本地 /covers 路径或后端图床地址）"
          placeholder="/covers/campus-launch.webp"
          icon={<ImageIcon width={18} height={18} />}
          error={errors.coverUrl?.message}
          {...register('coverUrl')}
        />
        <Select label="状态" options={statusOptions} error={errors.status?.message} {...register('status')} />
      </form>
    </Modal>
  );
}

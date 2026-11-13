import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ImageIcon, CalendarIcon, MapPinIcon } from '@/components/icons';
import { ActivityStatus, type ActivityView } from '@/contracts/api-contract';
import {
  activitySchema,
  type ActivityFormValues,
  isoToDatetimeLocal,
  datetimeLocalToIso,
  activityStatusLabel,
} from '@/lib/adminForms';

interface ActivityFormModalProps {
  open: boolean;
  /** 传入则为编辑模式，否则为新建。 */
  activity?: ActivityView | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: ActivityFormValues) => void;
}

const statusOptions = (Object.values(ActivityStatus) as ActivityStatus[]).map((s) => ({
  value: s,
  label: activityStatusLabel[s],
}));

export function ActivityFormModal({ open, activity, submitting, onClose, onSubmit }: ActivityFormModalProps) {
  const isEdit = !!activity;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    values: {
      title: activity?.title ?? '',
      summary: activity?.summary ?? '',
      content: activity?.content ?? '',
      coverUrl: activity?.coverUrl ?? '',
      location: activity?.location ?? '',
      startAt: isoToDatetimeLocal(activity?.startAt ?? ''),
      endAt: isoToDatetimeLocal(activity?.endAt ?? ''),
      capacity: activity?.capacity ?? 50,
      status: activity?.status ?? ActivityStatus.DRAFT,
    },
  });

  function handleClose() {
    reset();
    onClose();
  }

  function submit(values: ActivityFormValues) {
    onSubmit({
      ...values,
      startAt: datetimeLocalToIso(values.startAt),
      endAt: datetimeLocalToIso(values.endAt),
    });
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? '编辑活动' : '新建活动'}
      footer={
        <>
          <Button variant="ghost" size="sm" type="button" onClick={handleClose}>
            取消
          </Button>
          <Button variant="primary" size="sm" type="submit" form="activity-form" disabled={submitting}>
            {submitting ? '保存中…' : isEdit ? '保存修改' : '创建活动'}
          </Button>
        </>
      }
    >
      <form id="activity-form" onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        <Input
          label="标题"
          placeholder="例如：校园开放日 · 实验室漫游"
          error={errors.title?.message}
          {...register('title')}
        />
        <Textarea
          label="摘要"
          rows={2}
          placeholder="一句话简介，展示在列表与卡片上"
          error={errors.summary?.message}
          {...register('summary')}
        />
        <Textarea
          label="正文"
          rows={5}
          placeholder="活动详情，支持换行"
          error={errors.content?.message}
          {...register('content')}
        />
        <Input
          label="封面图（本地 /covers 路径或后端图床地址）"
          placeholder="/covers/campus-open-day.webp"
          icon={<ImageIcon width={18} height={18} />}
          error={errors.coverUrl?.message}
          {...register('coverUrl')}
        />
        <Input
          label="地点"
          placeholder="例如：校本部 · 理工楼"
          icon={<MapPinIcon width={18} height={18} />}
          error={errors.location?.message}
          {...register('location')}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="开始时间"
            type="datetime-local"
            icon={<CalendarIcon width={18} height={18} />}
            error={errors.startAt?.message}
            {...register('startAt')}
          />
          <Input
            label="结束时间"
            type="datetime-local"
            icon={<CalendarIcon width={18} height={18} />}
            error={errors.endAt?.message}
            {...register('endAt')}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="容量"
            type="number"
            min={1}
            error={errors.capacity?.message}
            {...register('capacity', { valueAsNumber: true })}
          />
          <Select label="状态" options={statusOptions} error={errors.status?.message} {...register('status')} />
        </div>
      </form>
    </Modal>
  );
}

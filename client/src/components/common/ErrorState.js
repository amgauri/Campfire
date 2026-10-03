import EmptyState from '@/components/common/EmptyState';
import { getErrorCopy } from '@/utils/errorCopy';

/** Pass the ApiError (or anything with code/status) from React Query. Copy is derived for you. */
export default function ErrorState({ error, title, message, onRetry, retryLabel = 'Try again', style }) {
  const copy = getErrorCopy(error);

  return (
    <EmptyState
      tone="danger"
      icon={copy.icon}
      title={title ?? copy.title}
      message={message ?? copy.message}
      actionLabel={onRetry ? retryLabel : undefined}
      onAction={onRetry}
      style={style}
    />
  );
}
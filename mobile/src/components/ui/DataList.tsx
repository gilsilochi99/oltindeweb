import { FlatList, RefreshControl, type ListRenderItem } from 'react-native';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import type { LucideIcon } from 'lucide-react-native';

interface DataListProps<T> {
  data: T[] | undefined;
  isLoading: boolean;
  keyExtractor: (item: T) => string;
  renderItem: ListRenderItem<T>;
  emptyTitle: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  ListHeaderComponent?: React.ComponentProps<typeof FlatList>['ListHeaderComponent'];
  ListFooterComponent?: React.ComponentProps<typeof FlatList>['ListFooterComponent'];
  numColumns?: number;
}

// Standard list screen shell: loading spinner → empty state → FlatList, with
// pull-to-refresh wired in whenever a screen passes onRefresh. Every
// section's index.tsx (companies, jobs, places...) is built on this so the
// loading/empty handling only has to be written once.
export function DataList<T>({
  data,
  isLoading,
  keyExtractor,
  renderItem,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  onRefresh,
  isRefreshing,
  ListHeaderComponent,
  ListFooterComponent,
  numColumns,
}: DataListProps<T>) {
  if (isLoading) return <LoadingState variant="list" />;
  if (!data || data.length === 0) {
    return (
      <>
        {ListHeaderComponent as any}
        <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
      </>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      numColumns={numColumns}
      contentContainerClassName="px-4 pb-8 pt-2 gap-3"
      columnWrapperClassName={numColumns && numColumns > 1 ? 'gap-3' : undefined}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!isRefreshing} onRefresh={onRefresh} tintColor="#FFCD00" /> : undefined
      }
    />
  );
}

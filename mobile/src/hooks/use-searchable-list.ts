import { useEffect, useMemo, useState } from 'react';

const PAGE_SIZE = 10;

// Shared search + "load more after 10" pagination logic for every directory
// list screen (companies, procedures, jobs...). Filtering and paging both
// happen client-side since these screens already fetch their full collection
// in one query — no server-side pagination exists for them.
export function useSearchableList<T>(data: T[] | undefined, getSearchText: (item: T) => string) {
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((item) => getSearchText(item).toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, query]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, data]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visible.length;
  const loadMore = () => setVisibleCount((c) => c + PAGE_SIZE);

  const closeSearch = () => {
    setIsSearching(false);
    setQuery('');
  };

  return { isSearching, setIsSearching, closeSearch, query, setQuery, visible, hasMore, loadMore, totalCount: filtered.length };
}

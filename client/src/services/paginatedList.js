const DEFAULT_PAGE_LIMIT = 100;

export const fetchAllPaginated = async (fetchPage, params = {}, pageLimit = DEFAULT_PAGE_LIMIT) => {
  const firstPage = await fetchPage({ ...params, page: 1, limit: pageLimit });
  const initialItems = Array.isArray(firstPage?.items) ? firstPage.items : [];
  const totalPages = Math.max(firstPage?.meta?.totalPages || 1, 1);

  if (totalPages === 1) {
    return {
      items: initialItems,
      meta: {
        ...firstPage?.meta,
        page: 1,
        limit: pageLimit,
        total: firstPage?.meta?.total ?? initialItems.length,
        totalPages,
      },
    };
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => fetchPage({ ...params, page: index + 2, limit: pageLimit })),
  );

  const items = [initialItems, ...remainingPages.map((pageData) => pageData?.items || [])].flat();

  return {
    items,
    meta: {
      ...firstPage?.meta,
      page: 1,
      limit: pageLimit,
      total: firstPage?.meta?.total ?? items.length,
      totalPages,
    },
  };
};

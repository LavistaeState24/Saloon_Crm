import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const defaultRowsPerPageOptions = [5, 10, 25, 50];

const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item)).join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value)
      .map((item) => normalizeValue(item))
      .join(" ");
  }

  return String(value);
};

export default function AdvancedDataTable({
  columns,
  rows,
  totalRecords,
  emptyMessage = "No records found.",
  loading = false,
  loadingMessage = "Loading records...",
  searchPlaceholder = "Search records...",
  rowsPerPageOptions = defaultRowsPerPageOptions,
  defaultRowsPerPage = 10,
  initialPage = 1,
  initialRowsPerPage,
  onTableStateChange,
}) {
  const resolvedDefaultRowsPerPage = rowsPerPageOptions.includes(defaultRowsPerPage)
    ? defaultRowsPerPage
    : rowsPerPageOptions[0];
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [rowsPerPage, setRowsPerPage] = useState(
    initialRowsPerPage || resolvedDefaultRowsPerPage
  );

  const updateTableState = (page, rows = rowsPerPage) => {
    setCurrentPage(page);
    setRowsPerPage(rows);
    onTableStateChange?.({
      page,
      rowsPerPage: rows,
    });
  };


  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) =>
      columns.some((column) => {
        if (column.searchable === false) {
          return false;
        }

        const value = column.searchValue ? column.searchValue(row) : row[column.key];
        return normalizeValue(value).toLowerCase().includes(query);
      }),
    );
  }, [columns, rows, searchQuery]);

  const totalRows = filteredRows.length;
  const resolvedTotalRecords = typeof totalRecords === "number" ? totalRecords : rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const pageStartIndex = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage;
  const pageEndIndex = Math.min(pageStartIndex + rowsPerPage, totalRows);
  const paginatedRows = filteredRows.slice(pageStartIndex, pageEndIndex);

  useEffect(() => {
    if (searchQuery.trim()) {
      updateTableState(1, rowsPerPage);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!loading && currentPage > totalPages) {
      updateTableState(totalPages, rowsPerPage);
    }
  }, [currentPage, loading, totalPages, rowsPerPage]);

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5 shadow-glass sm:rounded-[28px]">
      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
        <label className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-ivory outline-none transition placeholder:text-muted focus:border-gold/50 focus:bg-white/[0.06]"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:justify-end">
          {loading ? (
            <div className="space-y-2">
              <div className="h-3.5 w-56 max-w-full animate-pulse rounded-full bg-white/10" />
              <div className="h-3 w-40 animate-pulse rounded-full bg-white/10" />
            </div>
          ) : (
            <div className="text-sm text-muted">
              {searchQuery.trim()
                ? `${totalRows} matching record${totalRows === 1 ? "" : "s"} of ${resolvedTotalRecords} total`
                : `${resolvedTotalRecords} total record${resolvedTotalRecords === 1 ? "" : "s"}`}
            </div>
          )}

          <label className="flex items-center gap-3 text-sm text-muted">
            <span>Rows</span>
            <select
              value={rowsPerPage}
              onChange={(event) => updateTableState(1, Number(event.target.value))}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-ivory outline-none transition focus:border-gold/50"
            >
              {rowsPerPageOptions.map((option) => (
                <option key={option} value={option} className="bg-ink text-ivory">
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-left">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.22em] text-muted">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-4 py-3 font-medium sm:px-5 sm:py-4">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-ivory">
            {loading ? (
              Array.from({ length: Math.min(rowsPerPage, 5) }).map((_, index) => (
                <tr key={`loading-${index}`} className="animate-pulse">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 align-top sm:px-5 sm:py-4">
                      <div className="h-4 rounded-full bg-white/10" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedRows.length ? (
              paginatedRows.map((row, index) => (
                <tr key={row.id || row._id || index} className="hover:bg-white/[0.03]">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 align-top sm:px-5 sm:py-4">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-muted sm:px-5" colSpan={columns.length}>
                  {searchQuery ? "No matching records found." : emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 text-sm text-muted md:flex-row md:items-center md:justify-between sm:px-5">
        <p>
          {loading || totalRows === 0
            ? "Showing 0 to 0 of 0 entries"
            : searchQuery.trim()
              ? `Showing ${pageStartIndex + 1} to ${pageEndIndex} of ${totalRows} matching entries (${resolvedTotalRecords} total)`
              : `Showing ${pageStartIndex + 1} to ${pageEndIndex} of ${resolvedTotalRecords} entries`}
        </p>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={() => updateTableState(Math.max(1, currentPage - 1))}
            disabled={loading || currentPage === 1}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-ivory transition hover:border-gold/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>

          <span className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-ivory">
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => updateTableState(Math.min(totalPages, currentPage + 1))}
            disabled={loading || currentPage === totalPages}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-ivory transition hover:border-gold/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

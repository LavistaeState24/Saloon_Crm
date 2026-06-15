const SkeletonBlock = ({ className = "" }) => <div className={`animate-pulse rounded-2xl bg-white/10 ${className}`} />;

const SkeletonLine = ({ className = "" }) => <div className={`animate-pulse rounded-full bg-white/10 ${className}`} />;

const SkeletonCard = ({ className = "", children }) => (
  <div className={`rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass sm:rounded-[32px] sm:p-6 ${className}`}>{children}</div>
);

const SkeletonTextGroup = ({ titleWidth = "w-40", subtitleWidth = "w-28" }) => (
  <div className="space-y-2">
    <SkeletonLine className={`h-4 ${titleWidth}`} />
    <SkeletonLine className={`h-3 ${subtitleWidth}`} />
  </div>
);

const SkeletonTable = ({ rows = 5, columns = 6 }) => (
  <div className="overflow-hidden rounded-2xl border border-white/10">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-white/10 text-left">
        <thead className="bg-white/5">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={`header-${index}`} className="px-4 py-3 sm:px-5 sm:py-4">
                <SkeletonLine className="h-3.5 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <td key={`cell-${rowIndex}-${columnIndex}`} className="px-4 py-3 align-top sm:px-5 sm:py-4">
                  <SkeletonLine className={`h-4 ${columnIndex === 0 ? "w-32" : columnIndex === columns - 1 ? "w-20" : "w-24"}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const renderDashboardSkeleton = () => (
  <div className="space-y-6">
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <SkeletonCard key={`stat-${index}`} className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <SkeletonBlock className="h-12 w-12 rounded-2xl" />
            <SkeletonLine className="h-4 w-16" />
          </div>
          <SkeletonTextGroup titleWidth="w-32" subtitleWidth="w-20" />
          <SkeletonLine className="h-8 w-24" />
        </SkeletonCard>
      ))}
    </section>

    <div className="grid gap-6 xl:grid-cols-2">
      <SkeletonCard className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <SkeletonTextGroup titleWidth="w-44" subtitleWidth="w-28" />
          <SkeletonLine className="h-10 w-28 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock key={`dashboard-card-${index}`} className="h-24 rounded-3xl" />
          ))}
        </div>
      </SkeletonCard>

      <SkeletonCard className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <SkeletonTextGroup titleWidth="w-40" subtitleWidth="w-32" />
          <SkeletonLine className="h-10 w-24 rounded-2xl" />
        </div>
        <SkeletonTable rows={4} columns={5} />
      </SkeletonCard>
    </div>
  </div>
);

const renderFormSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <SkeletonLine className="h-3 w-28" />
      <SkeletonLine className="h-10 w-80 max-w-full" />
      <SkeletonLine className="h-4 w-64" />
    </div>

    <SkeletonCard className="space-y-6">
      <div className="space-y-2">
        <SkeletonLine className="h-3 w-28" />
        <SkeletonLine className="h-7 w-72 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={`field-${index}`} className="space-y-2">
            <SkeletonLine className="h-4 w-32" />
            <SkeletonBlock className="h-12 rounded-2xl" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <SkeletonBlock className="h-11 w-full rounded-2xl sm:w-32" />
        <SkeletonBlock className="h-11 w-full rounded-2xl sm:w-36" />
      </div>
    </SkeletonCard>
  </div>
);

const renderDetailSkeleton = () => (
  <div className="space-y-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-3">
        <SkeletonLine className="h-3 w-28" />
        <SkeletonLine className="h-10 w-80 max-w-full" />
        <SkeletonLine className="h-4 w-52" />
      </div>
      <div className="flex flex-wrap gap-3">
        <SkeletonLine className="h-10 w-24 rounded-full" />
        <SkeletonLine className="h-10 w-28 rounded-full" />
        <SkeletonLine className="h-11 w-32 rounded-2xl" />
      </div>
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <SkeletonCard className="space-y-5">
        <SkeletonTextGroup titleWidth="w-44" subtitleWidth="w-32" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonBlock key={`detail-a-${index}`} className="h-24 rounded-3xl" />
          ))}
        </div>
      </SkeletonCard>

      <SkeletonCard className="space-y-5">
        <SkeletonTextGroup titleWidth="w-40" subtitleWidth="w-28" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock key={`detail-b-${index}`} className="h-20 rounded-3xl" />
          ))}
        </div>
      </SkeletonCard>
    </div>

    <SkeletonCard className="space-y-5">
      <SkeletonTextGroup titleWidth="w-44" subtitleWidth="w-36" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={`detail-c-${index}`} className="h-28 rounded-3xl" />
        ))}
      </div>
    </SkeletonCard>
  </div>
);

const renderTableSkeleton = () => (
  <div className="space-y-4">
    <div className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
      <div className="w-full max-w-md space-y-2">
        <SkeletonLine className="h-4 w-24" />
        <SkeletonBlock className="h-12 rounded-2xl" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:justify-end">
        <SkeletonLine className="h-4 w-56" />
        <SkeletonBlock className="h-10 w-28 rounded-xl" />
      </div>
    </div>
    <SkeletonTable />
    <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 text-sm sm:px-5 md:flex-row md:items-center md:justify-between">
      <SkeletonLine className="h-4 w-56" />
      <div className="flex items-center gap-2 self-end md:self-auto">
        <SkeletonBlock className="h-10 w-20 rounded-xl" />
        <SkeletonBlock className="h-10 w-20 rounded-xl" />
      </div>
    </div>
  </div>
);

const renderSettingsSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <SkeletonLine className="h-3 w-24" />
      <SkeletonLine className="h-10 w-80 max-w-full" />
    </div>
    <div className="grid gap-6 xl:grid-cols-2">
      <SkeletonCard className="space-y-6">
        <SkeletonTextGroup titleWidth="w-44" subtitleWidth="w-32" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <SkeletonBlock className="h-12 w-full rounded-2xl md:max-w-xs" />
          <SkeletonBlock className="h-12 w-full rounded-2xl md:max-w-xs" />
        </div>
        <SkeletonTable rows={5} columns={4} />
      </SkeletonCard>
      <SkeletonCard className="space-y-6">
        <SkeletonTextGroup titleWidth="w-36" subtitleWidth="w-28" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock key={`settings-${index}`} className="h-16 rounded-3xl" />
          ))}
        </div>
      </SkeletonCard>
    </div>
  </div>
);

const renderBreadcrumbSkeleton = () => (
  <div className="mb-4 flex items-center gap-2">
    <SkeletonLine className="h-4 w-16" />
    <SkeletonLine className="h-4 w-4 rounded-full" />
    <SkeletonLine className="h-4 w-24" />
    <SkeletonLine className="h-4 w-4 rounded-full" />
    <SkeletonLine className="h-4 w-20" />
  </div>
);

export default function PageSkeleton({ variant = "page", className = "" }) {
  const variants = {
    app: (
      <div className="flex min-h-screen items-center justify-center bg-ink bg-glow px-4 py-8">
        <div className="w-full max-w-md space-y-4 rounded-[28px] border border-gold/20 bg-white/5 p-6 shadow-glass">
          <div className="flex items-center gap-4">
            <SkeletonBlock className="h-12 w-12 rounded-2xl" />
            <div className="space-y-2">
              <SkeletonLine className="h-4 w-28" />
              <SkeletonLine className="h-3 w-40" />
            </div>
          </div>
          <SkeletonBlock className="h-2 rounded-full" />
          <SkeletonLine className="h-3 w-52" />
        </div>
      </div>
    ),

    dashboard: (
      <div className="space-y-4">
        {renderBreadcrumbSkeleton()}
        {renderDashboardSkeleton()}
      </div>
    ),

    detail: (
      <div className="space-y-4">
        {renderBreadcrumbSkeleton()}
        {renderDetailSkeleton()}
      </div>
    ),

    form: (
      <div className="space-y-4">
        {renderBreadcrumbSkeleton()}
        {renderFormSkeleton()}
      </div>
    ),

    page: (
      <div className="space-y-4">
        {renderBreadcrumbSkeleton()}
        {renderDetailSkeleton()}
      </div>
    ),

    settings: (
      <div className="space-y-4">
        {renderBreadcrumbSkeleton()}
        {renderSettingsSkeleton()}
      </div>
    ),

    table: (
      <div className="space-y-4">
        {renderBreadcrumbSkeleton()}
        {renderTableSkeleton()}
      </div>
    ),
  };

  return <div className={className}>{variants[variant] || variants.page}</div>;
}

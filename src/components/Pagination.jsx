// Pagination component with per-page options 20, 50, 200.
export function Pagination({ currentPage, totalPages, perPage, totalItems, onPageChange, onPerPageChange }) {
  const perPageOptions = [20, 50, 200]

  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * perPage + 1
  const endItem = Math.min(currentPage * perPage, totalItems)

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 shadow-sm sm:flex-row">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">
          Showing {startItem}-{endItem} of {totalItems}
        </span>
        <div className="flex items-center gap-2">
          <label htmlFor="per-page" className="text-sm text-muted">
            Per page:
          </label>
          <select
            id="per-page"
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="rounded-md border border-line bg-surface px-2 py-1 text-sm text-strong focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {perPageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="rounded-md px-2 py-1 text-sm font-medium text-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          &lt;&lt;
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-md px-2 py-1 text-sm font-medium text-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          &lt;
        </button>
        
        <span className="px-3 text-sm text-body">
          Page {currentPage} of {totalPages}
        </span>
        
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-md px-2 py-1 text-sm font-medium text-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          &gt;
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="rounded-md px-2 py-1 text-sm font-medium text-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          &gt;&gt;
        </button>
      </div>
    </div>
  )
}
import { SearchBar } from '../components/SearchBar.jsx'
import { ConversationTable } from '../components/ConversationTable.jsx'
import { Pagination } from '../components/Pagination.jsx'
import { ScrollToTopButton } from '../components/ScrollToTopButton.jsx'
import { useConversationFilters } from '../hooks/useConversationFilters.js'

// Browse/search conversations with advanced filters (AND logic). Filter state
// lives in the URL so a filtered view is shareable/bookmarkable.
export default function ConversationSearch() {
  const { filters, setFilter, setFilters, clearFilters, results, activeCount, totalItems, totalPages } = useConversationFilters()

  const handlePageChange = (page) => {
    setFilter('page', String(page))
  }

  const handlePerPageChange = (perPage) => {
    setFilter('perPage', String(perPage))
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">Search, filter, and play back customer service calls</p>
      </div>

      <SearchBar
        filters={filters}
        onChange={setFilter}
        onBatchChange={setFilters}
        onClear={clearFilters}
        activeCount={activeCount}
        resultCount={totalItems}
      />

      <ConversationTable conversations={results} />

      <Pagination
        currentPage={filters.page}
        totalPages={totalPages}
        perPage={filters.perPage}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onPerPageChange={handlePerPageChange}
      />

      {/* Floating scroll-to-top control (Conversations can be a long list). */}
      <ScrollToTopButton />
    </div>
  )
}

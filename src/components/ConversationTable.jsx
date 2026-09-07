import { Link } from 'react-router-dom'
import { formatDateTime, formatDuration, formatConversationId } from '../lib/formatters.js'

// Tabular list of conversations. Each row links to the detail/playback view.
export function ConversationTable({ conversations }) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center text-muted">
        No conversations match the current filters.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Conversation</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Started</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {conversations.map((c) => (
              <tr key={c.id} className="hover:bg-surface-muted">
                <td className="px-4 py-3">
                  <Link to={`/conversations/${c.id}`} className="font-medium text-primary-600 hover:underline">
                    {formatConversationId(c.id)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-body">{c.customer}</td>
                <td className="px-4 py-3 text-body">{c.agent}</td>
                <td className="px-4 py-3 text-muted">
                  {c.durationSeconds ? formatDuration(c.durationSeconds) : '-'}
                </td>
                <td className="px-4 py-3 text-faint">{formatDateTime(c.startedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

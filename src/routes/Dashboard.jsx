import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DateRangePicker } from '../components/DateRangePicker.jsx'
import { ContactVolumeChart } from '../components/ContactVolumeChart.jsx'
import { StatCard } from '../components/StatCard.jsx'
import { useDateRangeFilter } from '../hooks/useDateRangeFilter.js'
import { fetchAnalytics } from '../lib/api.js'
import { formatDuration, formatNumber } from '../lib/formatters.js'

// Dashboard overview. Every panel reacts to the shared date-range filter.
export default function Dashboard() {
  const { from, to, setRange } = useDateRangeFilter()
  const [metrics, setMetrics] = useState(null)
  const [agents, setAgents] = useState([])

  useEffect(() => {
    let cancelled = false
    fetchAnalytics('kpis', { from, to })
      .then((data) => { if (!cancelled) setMetrics(data) })
      .catch(console.error)
    fetchAnalytics('top-agents', { from, to })
      .then((data) => { if (!cancelled) setAgents(data.data || []) })
      .catch(console.error)
    return () => { cancelled = true }
  }, [from, to])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold text-strong">Dashboard</h1>
          <p className="text-sm text-muted">Customer service conversation overview</p>
        </div>
        <DateRangePicker from={from} to={to} onChange={setRange} maxDateRange={365} />
      </div>

      {/* KPI row (colored cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Conversations"
          value={metrics ? formatNumber(metrics.totalConversations.value) : '-'}
          delta={metrics?.totalConversations.delta * 100}
          deltaGood="up"
          hint="vs. previous period"
          tone="one"
        />
        <StatCard
          label="Avg Handle Time"
          value={metrics ? formatDuration(metrics.avgHandleTime.value) : '-'}
          delta={metrics?.avgHandleTime.delta * 100}
          deltaGood="down"
          hint="calls & chats"
          tone="two"
        />
        <StatCard
          label="Active Agents"
          value={metrics ? formatNumber(metrics.activeAgents.value) : '-'}
          hint="handled >=1 contact"
          tone="brand"
        />
      </div>

      {/* Contact Volume trend */}
      <ContactVolumeChart from={from} to={to} />

      {/* Secondary panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top agents by volume */}
        <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-strong">Top Agents by Volume</h2>
          {agents.length === 0 ? (
            <p className="text-sm text-muted">No conversations in this range.</p>
          ) : (
            <ul className="space-y-3">
              {agents.map(({ name, count }) => {
                const max = agents[0].count
                return (
                  <li key={name} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-sm text-body">{name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full bg-primary-500"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm text-muted">{count}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          to={`/conversations?from=${from}&to=${to}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Browse all conversations
        </Link>
      </div>
    </div>
  )
}

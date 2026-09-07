// MOCK ANALYTICS - derived from the mock conversations. These helpers aggregate the raw
// conversation list so the dashboard can react to the shared date-range filter.

import { conversations } from './conversations.js'
import { CHANNELS } from '../lib/constants.js'
import { toISODate } from '../lib/formatters.js'

/** Filter conversations to those whose startedAt falls within [from, to] (inclusive, ISO date strings). */
export function conversationsInRange(from, to) {
  const fromMs = new Date(`${from}T00:00:00`).getTime()
  const toMs = new Date(`${to}T23:59:59`).getTime()
  return conversations.filter((c) => {
    const t = new Date(c.startedAt).getTime()
    return t >= fromMs && t <= toMs
  })
}

/** Headline KPIs for the range, plus period-over-period deltas vs the preceding equal-length window. */
export function summaryMetrics(from, to) {
  const current = conversationsInRange(from, to)

  // Preceding window of equal length for delta comparison.
  const days = daysBetween(from, to)
  const prevTo = shiftISO(from, -1)
  const prevFrom = shiftISO(prevTo, -(days - 1))
  const previous = conversationsInRange(prevFrom, prevTo)

  const avgHandle = (list) => {
    const calls = list.filter((c) => c.durationSec > 0)
    if (!calls.length) return 0
    return calls.reduce((sum, c) => sum + c.durationSec, 0) / calls.length
  }
  const negRate = (list) =>
    list.length ? (list.filter((c) => c.sentiment === 'negative').length / list.length) * 100 : 0

  return {
    totalConversations: {
      value: current.length,
      delta: pctChange(current.length, previous.length),
    },
    avgHandleTime: {
      value: avgHandle(current),
      delta: pctChange(avgHandle(current), avgHandle(previous)),
    },
    negativeRate: {
      value: negRate(current),
      delta: pctChange(negRate(current), negRate(previous)),
    },
    uniqueAgents: {
      value: new Set(current.map((c) => c.agent)).size,
      delta: 0,
    },
  }
}

/** Contact volume bucketed by day across the range: [{ label, date, call, chat, email, total }]. */
export function volumeByDay(from, to) {
  const buckets = new Map()
  // Seed every day in the range so gaps render as zero.
  for (let d = new Date(`${from}T00:00:00`); toISODate(d) <= to; d.setDate(d.getDate() + 1)) {
    buckets.set(toISODate(d), emptyBucket())
  }
  for (const c of conversationsInRange(from, to)) {
    const key = toISODate(new Date(c.startedAt))
    const b = buckets.get(key)
    if (b) {
      b[c.channel] += 1
      b.total += 1
    }
  }
  return [...buckets.entries()].map(([date, b]) => ({
    date,
    label: new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ...b,
  }))
}

/** Contact volume aggregated by hour-of-day (0-23) across the range. */
export function volumeByHour(from, to) {
  const buckets = Array.from({ length: 24 }, () => emptyBucket())
  for (const c of conversationsInRange(from, to)) {
    const h = new Date(c.startedAt).getHours()
    buckets[h][c.channel] += 1
    buckets[h].total += 1
  }
  return buckets.map((b, h) => ({
    hour: h,
    label: `${((h + 11) % 12) + 1}${h < 12 ? 'a' : 'p'}`,
    ...b,
  }))
}

/** Sentiment distribution for the range: [{ sentiment, count }]. */
export function sentimentBreakdown(from, to) {
  const list = conversationsInRange(from, to)
  const counts = { positive: 0, neutral: 0, negative: 0 }
  for (const c of list) counts[c.sentiment] += 1
  return counts
}

/** Top agents by conversation volume for the range. */
export function topAgents(from, to, limit = 5) {
  const list = conversationsInRange(from, to)
  const counts = new Map()
  for (const c of list) counts.set(c.agent, (counts.get(c.agent) || 0) + 1)
  return [...counts.entries()]
    .map(([agent, count]) => ({ agent, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// --- small helpers ----------------------------------------------------------
function emptyBucket() {
  const b = { total: 0 }
  for (const ch of CHANNELS) b[ch] = 0
  return b
}

function pctChange(current, previous) {
  if (!previous) return current ? 100 : 0
  return ((current - previous) / previous) * 100
}

function daysBetween(from, to) {
  const ms = new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)
  return Math.round(ms / 86400000) + 1
}

function shiftISO(iso, deltaDays) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + deltaDays)
  return toISODate(d)
}

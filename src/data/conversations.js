// MOCK DATA - replace with API call to /api/conversations
//
// Schema follows docs/DB_SCHEMA.md. Conversations are generated deterministically
// (seeded PRNG) so numbers stay stable across reloads.

import { AGENTS, TAGS } from '../lib/constants.js'

// --- deterministic pseudo-randomness (mulberry32) ---------------------------
function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260706)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const between = (min, max) => Math.floor(rand() * (max - min + 1)) + min
const uuid = (i) => `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`

// Mock agents (from DB_SCHEMA agents table)
export const agents = AGENTS.map((name, i) => ({
  id: uuid(i + 100),
  name,
  email: `${name.toLowerCase().replace(' ', '.')}@company.com`,
  team: ['Support', 'Billing', 'Technical'][i % 3],
}))

// Mock customers
const FIRST_NAMES = ['Jordan', 'Casey', 'Riley', 'Avery', 'Morgan', 'Quinn', 'Harper', 'Rowan', 'Devon', 'Skyler', 'Elena', 'Marcus', 'Nadia', 'Theo', 'Isla']
const LAST_NAMES = ['Reyes', 'Kim', 'Novak', 'Osei', 'Fischer', 'Baptiste', 'Lindqvist', 'Costa', 'Iqbal', 'Moreau', 'Bauer', 'Silva']

export const customers = Array.from({ length: 100 }, (_, i) => ({
  id: uuid(i + 1000),
  name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
  email: `customer${i}@example.com`,
  phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
  createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
}))

// Mock tags (from DB_SCHEMA tags table)
export const tags = TAGS.map((label, i) => ({
  id: uuid(i + 200),
  label,
}))

function generateConversations(count) {
  const list = []
  const now = new Date()
  now.setHours(23, 59, 0, 0)

  for (let i = 0; i < count; i++) {
    // Spread conversations across the last 60 days.
    const daysAgo = between(0, 59)
    const started = new Date(now)
    started.setDate(started.getDate() - daysAgo)

    // Bias contact hours toward a working-day shape
    const hourPool = [8, 9, 9, 10, 10, 11, 11, 12, 13, 13, 14, 14, 15, 15, 16, 16, 17, 18, 19, 20]
    started.setHours(pick(hourPool), between(0, 59), 0, 0)

    const tag = pick(tags)
    const agent = pick(agents)
    const customer = pick(customers)
    const durationSec = between(90, 900)
    const endedAt = new Date(started.getTime() + durationSec * 1000)

    list.push({
      // Primary key
      id: uuid(i + 1),
      // Foreign keys
      customerId: customer.id,
      agentId: agent.id,
      // Conversation fields
      channel: 'call',
      startedAt: started.toISOString(),
      endedAt: endedAt.toISOString(),
      durationSeconds: durationSec,
      status: pick(['resolved', 'resolved', 'resolved', 'escalated']),
      createdAt: started.toISOString(),
      // Denormalized for display
      customer: customer.name,
      agent: agent.name,
      // Tags (many-to-many)
      tags: [tag],
      // Audio (one-to-one) - all have audio
      audio: {
        url: '/audio/sample-call.wav',
        durationSeconds: durationSec,
        format: 'wav',
      },
    })
  }

  // Newest first.
  return list.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
}

export const conversations = generateConversations(160)

/** Lookup helper mirroring a `GET /api/conversations/:id`. */
export function getConversationById(id) {
  return conversations.find((c) => c.id === id) || null
}

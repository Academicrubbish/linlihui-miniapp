// In-memory optimistic transactions. A conflicting commit fails instead of overwriting data.
const clone = value => structuredClone(value)
const op = (kind, value) => ({ kind, value })
function matches(row, query) {
  if (query.kind === 'or') return query.value.some(q => matches(row, q))
  if (query.kind === 'and') return query.value.every(q => matches(row, q))
  return Object.entries(query).every(([key, condition]) => {
    const v = row[key]
    if (condition instanceof RegExp) return condition.test(v)
    if (condition && condition.kind) return ({ in: () => condition.value.includes(v), neq: () => v !== condition.value, gt: () => v > condition.value, lt: () => v < condition.value })[condition.kind]()
    return v === condition
  })
}
function database() {
  let state = {}; let version = 0; let failWrite = false
  function adapter(getState, changed, inTransaction = false) {
    return {
      collection(name) {
        const collection = () => getState()[name] ||= {}
        return {
          doc(id) {
            return {
              async get() { const value = clone(collection()[id]); return { data: inTransaction ? value : value ? [value] : [] } },
              async update(data) { if ('_id' in data) throw new Error('immutable _id'); if (collection()[id]) { Object.assign(collection()[id], clone(data)); changed(); return { updated: 1 } } return { updated: 0 } },
              async remove() { delete collection()[id]; changed(); return { deleted: 1 } }
            }
          },
          async add(data) { if (failWrite && name === 'hl-ledgers') { failWrite = false; throw new Error('injected failure') } if (collection()[data._id]) throw new Error('duplicate'); collection()[data._id] = clone(data); changed(); return { id: data._id } },
          where(query) {
            let sortKey; let sortDir; let skip = 0; let limit = 100
            const q = {
              orderBy(key, dir) { sortKey = key; sortDir = dir; return q },
              skip(value) { skip = value; return q },
              limit(value) { limit = value; return q },
              async get() { let rows = Object.values(collection()).filter(row => matches(row, query)); if (sortKey) rows.sort((a, b) => (a[sortKey] - b[sortKey]) * (sortDir === 'desc' ? -1 : 1)); return { data: clone(rows.slice(skip, skip + limit)) } },
              async remove() { for (const row of Object.values(collection())) if (matches(row, query)) delete collection()[row._id]; changed() }
            }; return q
          }
        }
      }
    }
  }
  const db = adapter(() => state, () => { version++ })
  db.command = Object.fromEntries(['in', 'neq', 'gt', 'lt', 'or', 'and'].map(kind => [kind, value => op(kind, value)]))
  db.startTransaction = async () => {
    const base = version; const snapshot = clone(state); let dirty = false
    return { ...adapter(() => snapshot, () => { dirty = true }, true),
      async commit() { if (dirty && version !== base) throw new Error('transaction conflict'); if (dirty) { state = snapshot; version++ } },
      async rollback() {}
    }
  }
  db.dump = () => clone(state)
  db.injectLedgerFailure = () => { failWrite = true }
  return db
}
module.exports = { database }

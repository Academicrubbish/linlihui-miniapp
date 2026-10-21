'use strict'
const D = require('./domain')
const T = { customers: 'hl-customers', admins: 'hl-admins', sessions: 'hl-sessions', orders: 'hl-orders', proofs: 'hl-proofs', ledgers: 'hl-ledgers', logs: 'hl-logs' }
const DAY = 86400000
async function get(db, table, id) {
  const { data } = await db.collection(T[table]).doc(id).get()
  return Array.isArray(data) ? data[0] : data
}
async function transaction(db, work) {
  const tx = await db.startTransaction()
  try {
    const result = await work(tx)
    await tx.commit()
    return result
  } catch (error) {
    try { await tx.rollback() } catch (_) { /* Commit may already have succeeded; idempotent IDs protect retries. */ }
    throw error
  }
}
function createService(db, exchangeCode, clock = Date.now) {
  const add = (tx, table, data) => tx.collection(T[table]).add(data)
  const update = (tx, table, id, data) => tx.collection(T[table]).doc(id).update(data)
  async function session(token) {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) D.fail('请重新打开小程序登录', 'AUTH')
    const value = await get(db, 'sessions', D.hash(token))
    if (!value || value.expiresAt <= clock()) D.fail('登录已过期，请重新登录', 'AUTH')
    return value
  }
  async function admin(s, tx = db) {
    const a = await get(tx, 'admins', s.customerId)
    // Only the openID obtained server-side from WeChat is trusted. Recheck the allowlist on every request.
    if (!a || a.enabled !== true || a.openid !== s.openid) D.fail('当前微信未登记为管理员，请联系店主', 'ADMIN_AUTH')
    return a
  }
  async function audit(tx, id, operator, action, target, details = {}) {
    await add(tx, 'logs', { _id: id, operator, action, target, details, createdAt: clock() })
  }
  async function customer(tx, id) {
    const c = await get(tx, 'customers', id)
    if (!c) D.fail('没有找到这位顾客')
    D.available(c)
    return c
  }
  const handlers = {
    async login(p) {
      const openid = await exchangeCode(D.text(p.code, 256, '微信登录凭证'))
      const id = D.hash(openid)
      await transaction(db, async tx => {
        if (!await get(tx, 'customers', id)) await add(tx, 'customers', { _id: id, openid, name: '', balance: 0, reserved: 0, createdAt: clock(), updatedAt: clock() })
      })
      const token = D.random()
      await add(db, 'sessions', { _id: D.hash(token), customerId: id, openid, expiresAt: clock() + 7 * DAY })
      return { token }
    },
    async home(p, s) {
      const c = await customer(db, s.customerId)
      const orders = await db.collection(T.orders).where({ customerId: c._id }).orderBy('createdAt', 'desc').skip(offset(p.offset)).limit(20).get()
      return { customer: D.publicCustomer(c), orders: orders.data.map(publicOrder), hasMore: orders.data.length === 20 }
    },
    async saveName(p, s) {
      const name = D.text(p.name, 20, '姓名')
      await update(db, 'customers', s.customerId, { name, updatedAt: clock() })
      return { name }
    },
    async submitOrder(p, s) {
      const orderNo = D.orderNumber(p.orderNo)
      const image = D.proof(p.base64)
      const id = D.hash(orderNo)
      return transaction(db, async tx => {
        const c = await customer(tx, s.customerId)
        if (!c.name) D.fail('请先填写您的姓名')
        const existing = await get(tx, 'orders', id)
        if (existing && existing.customerId !== c._id) D.fail('这个订单已提交，请联系店主核实')
        if (existing && existing.status !== 'rejected') return publicOrder(existing)
        // Serialize submissions on the customer document; cap burst uploads without exposing an extra step.
        if (c.lastSubmitAt && clock() - c.lastSubmitAt < 10000) D.fail('刚刚已提交，请稍后再交下一单')
        await update(tx, 'customers', c._id, { lastSubmitAt: clock() })
        const order = { _id: id, customerId: c._id, orderNo, status: 'pending', createdAt: existing ? existing.createdAt : clock(), updatedAt: clock(), note: '', amount: 0, payout: 0, owner: '', ownerName: '', proofExpiresAt: 0 }
        if (existing) {
          const { _id, ...changes } = order
          await update(tx, 'orders', id, changes)
          if (await get(tx, 'proofs', id)) await update(tx, 'proofs', id, { ...image, updatedAt: clock() })
          else await add(tx, 'proofs', { _id: id, ...image, updatedAt: clock() })
        } else {
          await add(tx, 'orders', order)
          await add(tx, 'proofs', { _id: id, ...image, updatedAt: clock() })
        }
        await audit(tx, D.random(), c._id, 'submit', id)
        return publicOrder(order)
      })
    },
    async adminLogin(p, s) {
      const a = await admin(s)
      return { name: a.name || '管理员' }
    },
    async adminOrders(p, s) {
      const a = await admin(s)
      const status = p.history ? db.command.in(['paid', 'rejected']) : db.command.in(['pending', 'processing'])
      const rows = await db.collection(T.orders).where({ status }).orderBy('createdAt', p.history ? 'desc' : 'asc').skip(offset(p.offset)).limit(20).get()
      const orders = []
      for (const o of rows.data) orders.push({ ...publicOrder(o), mine: o.owner === s.customerId, customer: D.publicCustomer(await customer(db, o.customerId)) })
      return { orders, name: a.name || '管理员', hasMore: rows.data.length === 20 }
    },
    async searchCustomers(p, s) {
      await admin(s)
      const keyword = typeof p.keyword === 'string' ? p.keyword.trim().slice(0, 20) : ''
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const where = keyword ? db.command.or([{ name: new RegExp(escaped, 'i') }, { _id: new RegExp('^' + escaped.toLowerCase()) }]) : { name: db.command.neq('') }
      const rows = await db.collection(T.customers).where(where).orderBy('createdAt', 'desc').skip(offset(p.offset)).limit(20).get()
      return { customers: rows.data.map(D.publicCustomer), hasMore: rows.data.length === 20 }
    },
    async customerDetail(p, s) {
      await admin(s)
      const c = await customer(db, D.text(p.id, 64, '会员编号'))
      const rows = await db.collection(T.ledgers).where({ customerId: c._id }).orderBy('createdAt', 'desc').skip(offset(p.offset)).limit(20).get()
      return { customer: D.publicCustomer(c), ledgers: rows.data, hasMore: rows.data.length === 20 }
    },
    async grant(p, s) {
      const amount = D.cents(p.amount)
      if (amount > 50000) D.fail('一次最多发放 500 积分')
      const id = D.hash(s.customerId + ':grant:' + D.text(p.requestId, 80, '操作编号'))
      const customerId = D.text(p.customerId, 64, '会员编号')
      const note = typeof p.note === 'string' ? p.note.trim().slice(0, 80) : ''
      return transaction(db, async tx => {
        await admin(s, tx)
        const prior = await get(tx, 'ledgers', id)
        if (prior) {
          if (prior.customerId !== customerId || prior.amount !== amount || prior.note !== note) D.fail('操作内容已变化，请重新确认')
          return prior
        }
        const c = await customer(tx, customerId)
        if (c.balance + amount > D.MAX_CENTS) D.fail('积分余额超出上限，请核查')
        const ledger = { _id: id, customerId, amount, balanceAfter: c.balance + amount, type: 'grant', operator: s.customerId, note, createdAt: clock() }
        await update(tx, 'customers', c._id, { balance: c.balance + amount, updatedAt: clock() })
        await add(tx, 'ledgers', ledger)
        await audit(tx, id, s.customerId, 'grant', c._id, { amount, note })
        return ledger
      })
    },
    async proof(p, s) {
      await admin(s)
      const image = await get(db, 'proofs', D.text(p.id, 64, '订单编号'))
      if (!image) D.fail('截图已清理，请联系客户核实')
      return { base64: image.base64, mime: image.mime }
    },
    async prepare(p, s) {
      D.cents(p.amount)
      return transaction(db, async tx => {
        const a = await admin(s, tx)
        const o = await get(tx, 'orders', D.text(p.id, 64, '订单编号'))
        if (!o) D.fail('订单不存在')
        if (o.status === 'processing' && o.owner === s.customerId) return publicOrder(o)
        if (o.status !== 'pending') D.fail('订单已被处理，请刷新查看')
        const c = await customer(tx, o.customerId)
        const payout = D.settlement(c, p.amount)
        if (!payout) D.fail('客户暂无可用积分，不能转账')
        const change = { status: 'processing', amount: p.amount, payout, owner: s.customerId, ownerName: a.name || '管理员', updatedAt: clock() }
        await update(tx, 'customers', c._id, { reserved: c.reserved + payout, updatedAt: clock() })
        await update(tx, 'orders', o._id, change)
        await audit(tx, D.random(), s.customerId, 'prepare', o._id, { amount: p.amount, payout })
        return publicOrder({ ...o, ...change })
      })
    },
    async finish(p, s) {
      return transaction(db, async tx => {
        await admin(s, tx)
        const o = await get(tx, 'orders', D.text(p.id, 64, '订单编号'))
        if (!o) D.fail('订单不存在')
        if (o.status === 'paid' && o.owner === s.customerId) return publicOrder(o)
        if (o.status !== 'processing' || o.owner !== s.customerId) D.fail('只有领取订单的管理员可以确认转账')
        const c = await customer(tx, o.customerId)
        if (o.payout <= 0 || c.balance < o.payout || c.reserved < o.payout) D.fail('账户需要核查，请勿重复转账')
        const change = { status: 'paid', paidAt: clock(), updatedAt: clock(), proofExpiresAt: clock() + 90 * DAY }
        await update(tx, 'customers', c._id, { balance: c.balance - o.payout, reserved: c.reserved - o.payout, updatedAt: clock() })
        await update(tx, 'orders', o._id, change)
        await add(tx, 'ledgers', { _id: o._id, customerId: c._id, amount: -o.payout, balanceAfter: c.balance - o.payout, type: 'payment', operator: s.customerId, note: '订单 ' + o.orderNo, createdAt: clock() })
        await audit(tx, o._id, s.customerId, 'paid', o._id, { payout: o.payout })
        return publicOrder({ ...o, ...change })
      })
    },
    async cancel(p, s) {
      return transaction(db, async tx => {
        await admin(s, tx)
        const o = await get(tx, 'orders', D.text(p.id, 64, '订单编号'))
        if (!o || o.status !== 'processing' || o.owner !== s.customerId) D.fail('当前订单不能取消处理，请刷新查看')
        const c = await customer(tx, o.customerId)
        if (c.reserved < o.payout) D.fail('账户需要核查')
        await update(tx, 'customers', c._id, { reserved: c.reserved - o.payout, updatedAt: clock() })
        await update(tx, 'orders', o._id, { status: 'pending', payout: 0, owner: '', ownerName: '', updatedAt: clock() })
        await audit(tx, D.random(), s.customerId, 'cancel', o._id)
        return {}
      })
    },
    async reject(p, s) {
      const note = D.text(p.note, 100, '退回原因')
      return transaction(db, async tx => {
        await admin(s, tx)
        const o = await get(tx, 'orders', D.text(p.id, 64, '订单编号'))
        if (!o || o.status !== 'pending') D.fail('仅待处理的订单可以退回')
        await update(tx, 'orders', o._id, { status: 'rejected', note, updatedAt: clock(), proofExpiresAt: clock() + 90 * DAY })
        await audit(tx, D.random(), s.customerId, 'reject', o._id, { note })
        return {}
      })
    }
  }
  return async event => {
    if (!event || !Object.prototype.hasOwnProperty.call(handlers, event.action)) D.fail('不支持的操作')
    const s = event.action === 'login' ? null : await session(event.token)
    return handlers[event.action](event.payload || {}, s)
  }
}
function offset(value) { return Number.isInteger(value) && value >= 0 && value <= 100000 ? value : 0 }
function publicOrder(o) {
  const { _id, orderNo, status, createdAt, updatedAt, paidAt, note, amount, payout, ownerName } = o
  return { id: _id, orderNo, status, createdAt, updatedAt, paidAt, note, amount, payout, ownerName }
}
module.exports = { createService, T }

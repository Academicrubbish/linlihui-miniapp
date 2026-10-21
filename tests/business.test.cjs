const test = require('node:test')
const assert = require('node:assert/strict')
const { database } = require('./fake-db.cjs')
const { createService } = require('../uniCloud-alipay/cloudfunctions/haolin-api/service')
const D = require('../uniCloud-alipay/cloudfunctions/haolin-api/domain')
const screenshot = Buffer.concat([Buffer.from([255,216,255]), Buffer.alloc(120, 1)]).toString('base64')
async function fixture(balance = 500) {
  const db = database(); let time = 1800000000000
  const run = createService(db, async code => code, () => time)
  const login = async openid => (await run({ action: 'login', payload: { code: openid } })).token
  const customerToken = await login('customer-openid')
  const id = D.hash('customer-openid')
  await db.collection('hl-customers').doc(id).update({ name: '王阿姨', balance })
  const tokens = []
  for (const name of ['mom', 'dad']) {
    const token = await login(name)
    await db.collection('hl-admins').add({ _id: D.hash(name), openid: name, name, enabled: true })
    await run({ action: 'adminLogin', token })
    tokens.push(token)
  }
  const call = (action, payload = {}, token = tokens[0]) => run({ action, payload, token })
  const order = async (orderNo = 'ORDER001') => { time += 11000; return call('submitOrder', { orderNo, base64: screenshot }, customerToken) }
  return { db, call, order, id, tokens, customerToken, tick: ms => { time += ms } }
}
test('金额：少于、等于、多于余额以及零余额', () => {
  assert.equal(D.settlement({ balance: 500, reserved: 0 }, 3000), 500)
  assert.equal(D.settlement({ balance: 500, reserved: 0 }, 500), 500)
  assert.equal(D.settlement({ balance: 500, reserved: 0 }, 123), 123)
  assert.equal(D.settlement({ balance: 0, reserved: 0 }, 123), 0)
  assert.equal(D.settlement({ balance: 500, reserved: 400 }, 3000), 100)
  for (const value of [-1, 0, 1.1, Infinity, '100']) assert.throws(() => D.cents(value))
  assert.throws(() => D.available({ balance: 10, reserved: 11 }))
})
test('订单30元/积分5：锁定5，转账后扣至0；重复确认无副作用', async () => {
  const f = await fixture(); const o = await f.order()
  const prepared = await f.call('prepare', { id: o.id, amount: 3000 })
  assert.equal(prepared.payout, 500)
  let c = (await f.call('home', {}, f.customerToken)).customer
  assert.equal(c.balance, 500); assert.equal(c.reserved, 500)
  await f.call('finish', { id: o.id }); await f.call('finish', { id: o.id })
  c = (await f.call('home', {}, f.customerToken)).customer
  assert.equal(c.balance, 0); assert.equal(c.reserved, 0)
  assert.equal(Object.keys(f.db.dump()['hl-ledgers']).length, 1)
})
test('多人同时领取同一订单，只成功一个；非经办人不可扣款或释放', async () => {
  const f = await fixture(); const o = await f.order()
  const outcomes = await Promise.allSettled(f.tokens.map(token => f.call('prepare', { id: o.id, amount: 3000 }, token)))
  assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1)
  const loser = f.tokens[outcomes.findIndex(x => x.status === 'rejected')]
  await assert.rejects(f.call('finish', { id: o.id }, loser), /领取/)
  await assert.rejects(f.call('cancel', { id: o.id }, loser), /取消/)
})
test('两张订单并发不会透支，可取消后重办', async () => {
  const f = await fixture(); const a = await f.order('ORDER001'); const b = await f.order('ORDER002')
  await f.call('prepare', { id: a.id, amount: 400 })
  assert.equal((await f.call('prepare', { id: b.id, amount: 1000 }, f.tokens[1])).payout, 100)
  await f.call('cancel', { id: a.id })
  assert.equal((await f.call('home', {}, f.customerToken)).customer.reserved, 100)
  await f.call('finish', { id: b.id }, f.tokens[1])
  assert.equal((await f.call('prepare', { id: a.id, amount: 1000 })).payout, 400)
  await f.call('finish', { id: a.id })
  assert.equal((await f.call('home', {}, f.customerToken)).customer.balance, 0)
})
test('写流水失败时余额、订单状态全部回滚', async () => {
  const f = await fixture(); const o = await f.order()
  await f.call('prepare', { id: o.id, amount: 3000 })
  f.db.injectLedgerFailure()
  await assert.rejects(f.call('finish', { id: o.id }), /injected/)
  const home = await f.call('home', {}, f.customerToken)
  assert.equal(home.customer.balance, 500); assert.equal(home.customer.reserved, 500)
  assert.equal(home.orders[0].status, 'processing')
  await f.call('finish', { id: o.id })
})
test('发放幂等、不同参数不能复用操作号，越权不可发放', async () => {
  const f = await fixture()
  const payload = { customerId: f.id, amount: 1000, requestId: 'grant-001', note: '到店' }
  await f.call('grant', payload); await f.call('grant', payload)
  assert.equal((await f.call('home', {}, f.customerToken)).customer.balance, 1500)
  await assert.rejects(f.call('grant', { ...payload, amount: 2000 }), /变化/)
  await assert.rejects(f.call('grant', payload, f.customerToken), /管理员/)
  await assert.rejects(f.call('grant', { ...payload, amount: 50001 }), /500/)
})
test('订单去重、退回补交原位更新、截图清理后也可补交', async () => {
  const f = await fixture(); const a = await f.order('Order001')
  assert.equal((await f.order('ORDER001')).id, a.id)
  assert.equal(Object.keys(f.db.dump()['hl-orders']).length, 1)
  await f.call('reject', { id: a.id, note: '请重新截取收货状态' })
  await f.db.collection('hl-proofs').doc(a.id).remove()
  assert.equal((await f.order('ORDER001')).status, 'pending')
  assert.equal(Object.keys(f.db.dump()['hl-orders']).length, 1)
  assert.ok(f.db.dump()['hl-proofs'][a.id])
})
test('顾客不能读他人订单、截图、管理员列表；伪造身份无效', async () => {
  const f = await fixture(); const o = await f.order()
  for (const action of ['adminOrders', 'searchCustomers', 'proof', 'customerDetail']) await assert.rejects(f.call(action, { id: o.id }, f.customerToken), /管理员/)
  await assert.rejects(f.call('grant', { customerId: f.id, amount: 100, requestId: 'x', openid: 'mom' }, 'forged'), /登录/)
  await assert.rejects(f.call('addAdmin'), /不支持/)
  const home = await f.call('home', { customerId: D.hash('mom') }, f.customerToken)
  assert.equal(home.customer.id, f.id)
  assert.equal(home.customer.openid, undefined)
})
test('绑定微信无需密码，停用、删除或改绑立即撤销权限', async () => {
  const f = await fixture()
  assert.equal((await f.call('adminLogin')).name, 'mom')
  await assert.rejects(f.call('adminLogin', { openid: 'mom', role: 'admin' }, f.customerToken), /管理员/)
  await f.db.collection('hl-admins').doc(D.hash('mom')).update({ openid: 'another-wechat' })
  await assert.rejects(f.call('adminOrders'), /管理员/)
  await f.db.collection('hl-admins').doc(D.hash('mom')).update({ openid: 'mom', enabled: false })
  await assert.rejects(f.call('adminLogin'), /管理员/)
  await assert.rejects(f.call('adminOrders'), /管理员/)
  await assert.rejects(f.call('grant', { customerId: f.id, amount: 100, requestId: 'revoked-test' }), /管理员/)
  await f.db.collection('hl-admins').doc(D.hash('mom')).update({ enabled: true })
  assert.equal((await f.call('adminLogin')).name, 'mom')
  await f.db.collection('hl-admins').doc(D.hash('mom')).remove()
  await assert.rejects(f.call('adminOrders'), /管理员/)
})
test('零积分订单不能进入转账；上传拒绝非图片和超大数据', async () => {
  const f = await fixture(0); const o = await f.order()
  await assert.rejects(f.call('prepare', { id: o.id, amount: 100 }), /暂无可用积分/)
  assert.throws(() => D.proof('not-an-image'))
  assert.throws(() => D.proof('a'.repeat(830000)))
  assert.throws(() => D.orderNumber('abc<script>'))
})
test('会话超时必须重新验证', async () => {
  const f = await fixture(); f.tick(3 * 3600000)
  assert.equal((await f.call('adminLogin')).name, 'mom')
  f.tick(8 * 86400000)
  await assert.rejects(f.call('home', {}, f.customerToken), /过期/)
  await assert.rejects(f.call('adminLogin'), /过期/)
})

test('搜索将特殊字符当普通姓名，重复订单不能被其他账户占用', async () => {
  const f = await fixture(); await f.order()
  assert.equal((await f.call('searchCustomers', { keyword: '.*' })).customers.length, 0)
  assert.equal((await f.call('searchCustomers', { keyword: '王' })).customers[0].id, f.id)
  await assert.rejects(f.call('submitOrder', { orderNo: 'ORDER001', base64: screenshot }, f.tokens[1]), /姓名|已提交/)
  await f.call('saveName', { name: '王阿姨' }, f.tokens[1])
  await assert.rejects(f.call('submitOrder', { orderNo: 'ORDER001', base64: screenshot }, f.tokens[1]), /已提交/)
  assert.equal((await f.call('searchCustomers', { keyword: '王阿姨' })).customers.length, 2)
})

test('90天只清理已处理截图，保留账本和处理中凭证', async () => {
  const f = await fixture(); const paid = await f.order('ORDER001'); const pending = await f.order('ORDER002')
  await f.call('prepare', { id: paid.id, amount: 100 }); await f.call('finish', { id: paid.id })
  await f.call('prepare', { id: pending.id, amount: 100 })
  const clock = Date.now
  global.uniCloud = { database: () => f.db }
  try {
    Date.now = () => 1800000000000 + 91 * 86400000
    await require('../uniCloud-alipay/cloudfunctions/haolin-cleanup/index.obj')._timing()
  } finally { Date.now = clock; delete global.uniCloud }
  assert.equal(f.db.dump()['hl-proofs'][paid.id], undefined)
  assert.ok(f.db.dump()['hl-proofs'][pending.id])
  assert.ok(f.db.dump()['hl-ledgers'][paid.id])
})

test('所有新版表默认禁止客户端直接读写', () => {
  const fs = require('node:fs'); const path = require('node:path')
  const dir = path.join(__dirname, '../uniCloud-alipay/database')
  for (const name of fs.readdirSync(dir).filter(n => /^hl-.*\.schema\.json$/.test(n))) {
    const schema = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'))
    assert.deepEqual(schema.permission, { read: false, create: false, update: false, delete: false }, name)
  }
})

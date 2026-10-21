<template>
  <view class="screen">
    <view class="row admin-heading">
      <view class="grow"><text class="title">{{ section ? titles[section] : '店主管理' }}</text><text class="muted block">{{ adminName }}</text></view>
      <button class="link" :disabled="busy" @click="section ? back() : logout()">{{ section ? '返回' : '退出' }}</button>
    </view>
    <view v-if="error" class="error">{{ error }}<button class="link" :disabled="busy" @click="refresh">刷新重试</button><button v-if="authError" class="link" @click="goHome">返回客户首页</button></view>
    <view v-if="!section" class="menu stack">
      <button class="menu-button" :disabled="busy || authError" @click="open('orders')"><text class="menu-title">处理订单</text><text class="muted">看截图 · 转补贴 · 扣积分</text><text class="chevron">›</text></button>
      <button class="menu-button" :disabled="busy || authError" @click="open('grant')"><text class="menu-title">发放积分</text><text class="muted">找到顾客，再填写积分</text><text class="chevron">›</text></button>
      <button class="menu-button" :disabled="busy || authError" @click="open('search')"><text class="menu-title">查找顾客</text><text class="muted">看余额、查发放和扣减记录</text><text class="chevron">›</text></button>
    </view>
    <view v-if="pendingGrant" class="notice stack">
      <text class="block">有一笔积分发放还没确认结果。请先核实，避免重复发放。</text>
      <button class="secondary" :disabled="busy" @click="resolveGrant">核实上一笔发放</button>
    </view>

    <view v-if="section === 'orders'">
      <view class="row filter-row"><text class="muted">{{ history ? '已处理的订单' : '待处理的订单' }}</text><button class="link" :disabled="busy" @click="history = !history; fetchOrders()">{{ history ? '看待处理' : '看已处理' }}</button></view>
      <text v-if="!orders.length && !busy && !error" class="empty">这里暂时没有订单</text>
      <view v-for="o in orders" :key="o.id" class="card stack">
        <view class="row"><text class="title grow wrap">{{ o.customer.name }}</text><text class="badge">{{ statusName(o.status) }}</text></view>
        <text class="muted block">会员 {{ o.customer.memberNo }} · 积分 {{ money(o.customer.balance) }}</text>
        <text class="muted block wrap" selectable>订单 {{ o.orderNo }}</text>
        <text class="muted block">{{ date(o.createdAt) }}</text>
        <button class="secondary" :disabled="busy" @click="showProof(o)">查看收货截图</button>
        <view v-if="o.status === 'pending'" class="stack">
          <label class="field" :for="'amount-' + o.id">核实后的购物金额（元）</label>
          <input :id="'amount-' + o.id" v-model="amounts[o.id]" type="digit" maxlength="10" placeholder="按截图填写实付金额" :disabled="busy" />
          <text class="muted block">本次最多补贴 {{ money(o.customer.balance - o.customer.reserved) }} 元</text>
          <button class="primary" :disabled="busy || !amounts[o.id]" @click="prepare(o)">确认金额，准备转账</button>
          <button class="link" :disabled="busy" @click="reject(o)">信息不对，退回补充</button>
        </view>
        <view v-else-if="o.status === 'processing'">
          <view class="notice"><text class="block">本次应转 {{ money(o.payout) }} 元</text><text class="block">{{ o.mine ? '您正在处理，其他管理员不会重复办理。' : o.ownerName + '正在处理，请勿重复转账。' }}</text></view>
          <view v-if="o.mine" class="stack">
            <text class="muted block">请先在线下核对收款人并转账，再点击下面的按钮。</text>
            <button class="primary" :disabled="busy" @click="finish(o)">已转账，扣 {{ money(o.payout) }} 积分</button>
            <button class="link" :disabled="busy" @click="cancel(o)">还没转账，取消本次处理</button>
          </view>
        </view>
        <view v-else-if="o.status === 'paid'" class="notice">已转 {{ money(o.payout) }} 元，已扣 {{ money(o.payout) }} 积分</view>
        <text v-if="o.note" class="block">{{ o.note }}</text>
      </view>
      <button v-if="hasMore" class="secondary" :disabled="busy" @click="fetchOrders(true)">再看一些</button>
    </view>

    <view v-if="section === 'grant' || section === 'search'">
      <view v-if="!selected">
        <view class="row search-row"><input v-model="keyword" class="grow" placeholder="输入姓名或会员编号" maxlength="20" confirm-type="search" @confirm="search()" /><button class="search-button" :disabled="busy" @click="search()">查找</button></view>
        <text v-if="!customers.length && !busy && !error" class="empty">没有找到。请让顾客先打开小程序填写姓名。</text>
        <button v-for="c in customers" :key="c.id" class="customer-row" :disabled="busy" @click="select(c)">
          <view class="row"><view class="grow"><text class="customer-title block wrap">{{ c.name || '未填写姓名' }}</text><text class="muted block">会员 {{ c.memberNo }}</text></view><text class="customer-balance">{{ money(c.balance) }} 积分</text></view>
        </button>
        <button v-if="hasMore" class="secondary" :disabled="busy" @click="search(true)">再看一些</button>
      </view>
      <view v-else>
        <view class="card stack">
          <view class="row"><text class="title grow wrap">{{ selected.name }}</text><button class="link" :disabled="busy" @click="selected = null; search()">换一位</button></view>
          <text class="muted block">会员 {{ selected.memberNo }}</text>
          <text class="detail-balance block">{{ money(selected.balance) }} <text>积分</text></text>
          <text v-if="selected.reserved" class="muted block">其中 {{ money(selected.reserved) }} 积分正在办理补贴</text>
          <view v-if="section === 'grant'" class="stack">
            <label class="field" for="grant-amount">这次发多少积分？</label>
            <input id="grant-amount" v-model="grantAmount" type="digit" maxlength="7" placeholder="填写积分数" :disabled="busy" />
            <label class="field" for="grant-note">备注（可以不填）</label>
            <input id="grant-note" v-model="grantNote" maxlength="80" placeholder="例如：到店福利" :disabled="busy" />
            <button class="primary" :disabled="busy || !grantAmount || !!pendingGrant" :loading="busy" @click="grant">确认发放</button>
          </view>
        </view>
        <view v-if="section === 'search'" class="card">
          <text class="title">积分记录</text>
          <text v-if="!ledgers.length" class="muted block">还没有发放或使用记录</text>
          <view v-for="l in ledgers" :key="l._id" class="ledger-row">
            <view class="row"><text>{{ l.type === 'grant' ? '发放积分' : '订单补贴' }}</text><text class="ledger-number">{{ l.amount > 0 ? '+' : '−' }}{{ money(Math.abs(l.amount)) }}</text></view>
            <text class="muted block">{{ date(l.createdAt) }} · 结余 {{ money(l.balanceAfter) }}</text>
            <text v-if="l.note" class="muted block wrap">{{ l.note }}</text>
          </view>
          <button v-if="hasMore" class="link" :disabled="busy" @click="detail(true)">再看一些</button>
        </view>
      </view>
    </view>
    <text v-if="busy" class="muted block loading">正在处理，请稍候…</text>
  </view>
</template>
<script>
import { api, requestId, toCents, previewProof } from '@/services/benefit-service.js'
import { formatMoney, formatDate } from '@/utils/format.js'
export default {
  data() { return { section: '', titles: { orders: '处理订单', grant: '发放积分', search: '查找顾客' }, adminName: '', busy: false, error: '', authError: false, history: false, orders: [], hasMore: false, amounts: {}, customers: [], keyword: '', selected: null, ledgers: [], grantAmount: '', grantNote: '', grantRequest: null, pendingGrant: uni.getStorageSync('haolin_pending_grant') || null } },
  onShow() { this.refresh() },
  async onPullDownRefresh() { await this.refresh(); uni.stopPullDownRefresh() },
  methods: {
    money: formatMoney,
    date(value) { return formatDate(value, true) },
    statusName(value) { return { pending: '待处理', processing: '办理中', paid: '已转账', rejected: '已退回' }[value] },
    async run(work) {
      if (this.busy) return
      this.busy = true; this.error = ''
      try { await work(); this.authError = false }
      catch (e) { this.error = e.message; this.authError = e.code === 'ADMIN_AUTH' || e.code === 'AUTH' }
      finally { this.busy = false }
    },
    async confirm(title, content, confirmText = '确认') { return (await uni.showModal({ title, content, confirmText, cancelText: '再看看' })).confirm },
    async refresh() {
      if (this.section === 'orders') return this.fetchOrders()
      if (this.selected) return this.detail()
      if (this.section) return this.search()
      return this.run(async () => { const r = await api('adminOrders'); this.adminName = r.name })
    },
    open(section) { this.section = section; this.selected = null; this.hasMore = false; this.error = ''; this.refresh() },
    back() { this.section = ''; this.selected = null; this.error = ''; this.refresh() },
    goHome() { uni.reLaunch({ url: '/pages/index/index' }) },
    logout() { this.goHome() },
    async fetchOrders(more = false) {
      return this.run(async () => { const r = await api('adminOrders', { history: this.history, offset: more ? this.orders.length : 0 }); this.orders = more ? this.orders.concat(r.orders) : r.orders; this.hasMore = r.hasMore; this.adminName = r.name })
    },
    async search(more = false) {
      return this.run(async () => { const r = await api('searchCustomers', { keyword: this.keyword, offset: more ? this.customers.length : 0 }); this.customers = more ? this.customers.concat(r.customers) : r.customers; this.hasMore = r.hasMore })
    },
    select(c) { this.selected = c; this.grantAmount = ''; this.grantNote = ''; this.grantRequest = null; this.detail() },
    async detail(more = false) {
      return this.run(async () => { const r = await api('customerDetail', { id: this.selected.id, offset: more ? this.ledgers.length : 0 }); this.selected = r.customer; this.ledgers = more ? this.ledgers.concat(r.ledgers) : r.ledgers; this.hasMore = r.hasMore })
    },
    async showProof(o) { return this.run(() => previewProof(o.id)) },
    async prepare(o) {
      await this.run(async () => {
        const amount = toCents(this.amounts[o.id])
        if (!await this.confirm('先核对，再转账', `顾客：${o.customer.name}（${o.customer.memberNo}）\n购物金额：${this.money(amount)} 元\n系统会按剩余积分计算本次补贴。`, '核对无误')) return
        await api('prepare', { id: o.id, amount })
      })
      if (!this.error) await this.fetchOrders()
    },
    async finish(o) {
      await this.run(async () => {
        if (!await this.confirm('确认已实际转账', `已向 ${o.customer.name}（${o.customer.memberNo}）转了 ${this.money(o.payout)} 元？确认后扣除同等积分。未转账请返回。`, '已转账')) return
        await api('finish', { id: o.id })
      })
      if (!this.error) await this.fetchOrders()
    },
    async cancel(o) {
      await this.run(async () => {
        if (!await this.confirm('确认还没有转账', '仅在没有实际转账时取消。取消后订单可由其他管理员重新处理。', '尚未转账')) return
        await api('cancel', { id: o.id })
      })
      if (!this.error) await this.fetchOrders()
    },
    async reject(o) {
      await this.run(async () => {
        const r = await uni.showModal({ title: '告诉顾客要补充什么', editable: true, placeholderText: '例如：截图看不清，请重新上传', confirmText: '退回' })
        if (r.confirm) await api('reject', { id: o.id, note: r.content })
      })
      if (!this.error) await this.fetchOrders()
    },
    async grant() {
      await this.run(async () => {
        if (this.pendingGrant) throw new Error('请先核实上一笔发放结果')
        const payload = { customerId: this.selected.id, amount: toCents(this.grantAmount), note: this.grantNote.trim() }
        if (payload.amount > 50000) throw new Error('一次最多发放 500 积分')
        const key = JSON.stringify(payload)
        if (!this.grantRequest || this.grantRequest.key !== key) this.grantRequest = { key, id: requestId() }
        if (!await this.confirm('确认发给这位顾客', `${this.selected.name}（${this.selected.memberNo}）\n发放 ${this.money(payload.amount)} 积分`, '确认发放')) return
        this.pendingGrant = { ...payload, requestId: this.grantRequest.id }
        uni.setStorageSync('haolin_pending_grant', this.pendingGrant)
        const result = await this.sendGrant()
        uni.removeStorageSync('haolin_pending_grant'); this.pendingGrant = null
        this.selected.balance = result.balanceAfter; this.grantAmount = ''; this.grantNote = ''; this.grantRequest = null
        uni.showToast({ title: '积分已发放', icon: 'success' })
      })
    },
    async resolveGrant() {
      await this.run(async () => {
        const result = await this.sendGrant()
        uni.removeStorageSync('haolin_pending_grant'); this.pendingGrant = null
        this.grantRequest = null; this.grantAmount = ''; this.grantNote = ''
        if (this.selected && this.selected.id === result.customerId) this.selected.balance = result.balanceAfter
        uni.showToast({ title: '发放结果已确认', icon: 'success' })
      })
    },
    async sendGrant() {
      try { return await api('grant', this.pendingGrant) }
      catch (error) {
        // A confirmed validation rejection did not write. Unknown network outcomes must keep the same ID.
        if (error.code === 'INVALID') { uni.removeStorageSync('haolin_pending_grant'); this.pendingGrant = null }
        throw error
      }
    }
  }
}
</script>
<style scoped>
.admin-heading { margin: 8rpx 0 28rpx; }
.menu-button { position: relative; width: 100%; text-align: left; padding: 32rpx; border-radius: 24rpx; background: white; border: 2rpx solid #E1E6D9; }
.menu-title { display: block; color: #315A3F; font-size: 44rpx; font-weight: 700; }
.menu-button .muted { display: block; margin-top: 12rpx; padding-right: 24rpx; font-size: 30rpx; }
.chevron { position: absolute; right: 30rpx; top: 38rpx; font-size: 50rpx; color: #75906C; }
.empty { display: block; padding: 60rpx 12rpx; color: #606960; text-align: center; }
.badge { background: #EFF4EA; color: #315A3F; padding: 6rpx 16rpx; border-radius: 12rpx; font-size: 28rpx; flex-shrink: 0; }
.filter-row { margin-bottom: 16rpx; }
.search-row { margin-bottom: 28rpx; }
.search-button { min-height: 100rpx; background: #315A3F; color: white; font-size: 32rpx; padding: 20rpx; line-height: 1.7; border-radius: 16rpx; }
.customer-row { display: block; width: 100%; background: white; text-align: left; padding: 28rpx; border: 2rpx solid #E8E5DD; border-radius: 20rpx; margin-bottom: 20rpx; }
.customer-title { font-size: 36rpx; font-weight: 650; color: #292E2B; }
.customer-row .muted { font-size: 25rpx; }
.customer-balance { font-size: 32rpx; color: #315A3F; max-width: 42%; word-break: break-all; }
.detail-balance { color: #315A3F; font-size: 70rpx; font-weight: 650; overflow-wrap: anywhere; }
.detail-balance text { font-size: 30rpx; font-weight: 400; }
.ledger-row { border-top: 2rpx solid #EEECE5; padding: 24rpx 0; margin-top: 18rpx; }
.ledger-row .muted { font-size: 28rpx; }
.ledger-number { font-weight: 650; color: #315A3F; }
.loading { text-align: center; padding: 24rpx; }
</style>

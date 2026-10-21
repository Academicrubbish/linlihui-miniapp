<template>
  <view class="screen">
    <view class="brand-row">
      <image class="brand-icon" src="/static/haolin-station-avatar.png" mode="aspectFill" @click="tapBrand" />
      <view class="grow"><text class="brand-name">好邻小站</text><text class="muted block">熟人小店，贴心一点</text></view>
      <button class="link" @click="showRules = !showRules">使用说明</button>
    </view>

    <view v-if="showRules" class="card rules">
      <text class="title">积分怎么用？</text>
      <text class="block">① 填好姓名，方便店主给您发积分。</text>
      <text class="block">② 在店主经营的渠道购物并收货后，提交订单号和截图。</text>
      <text class="block">③ 店主核实后，线下把补贴转给您，再扣除积分。</text>
      <view class="notice">1 积分可补贴 1 元。比如购物 30 元、剩余 5 积分，就补贴 5 元，积分扣到 0。</view>
      <text class="muted block">积分由店主免费发放，不能充值、转让。不拉人、不计息。退货退款请及时联系店主核实。</text>
      <text class="field">个人信息说明</text>
      <text class="muted block">微信身份用于区分账户；姓名用于店主认人；订单号及收货截图仅用于核实补贴，由店主及获授权的家人查看。请遮住地址、电话等无关信息。截图在订单处理完成后保留 90 天，之后清理；账目保留用于对账。如需更正或删除信息，请联系店主。</text>
      <button class="link" @click="showRules = false">知道了，收起</button>
    </view>

    <view v-if="error" class="error">{{ error }}<button class="link" :disabled="loading" @click="load">重新加载</button></view>
    <view class="balance-panel">
      <text class="balance-label">我的积分</text>
      <view class="balance-value amount">{{ ready ? money(customer.balance) : '—' }}<text class="unit">积分</text></view>
      <text v-if="customer.reserved && ready" class="balance-note">其中 {{ money(customer.reserved) }} 积分正在办理补贴</text>
      <text v-else class="balance-note">{{ loading ? '正在读取…' : '购物收货后，可凭订单申请补贴' }}</text>
      <view class="identity">
        <view v-if="customer.name && !editName" class="row">
          <view class="grow"><text class="customer-name block wrap">{{ customer.name }}</text><text class="member-no">会员 {{ customer.memberNo }}</text></view>
          <button class="name-edit" :disabled="!ready || busy" @click="editName = true; name = customer.name">改姓名</button>
        </view>
        <view v-else>
          <label class="name-label" for="customer-name">先填您的姓名，店主才知道发给谁</label>
          <view class="row">
            <input id="customer-name" v-model="name" class="grow" maxlength="20" placeholder="店主认识的姓名" :disabled="!ready || busy" />
            <button class="name-save" :disabled="!ready || busy || !name.trim()" @click="saveName">保存</button>
          </view>
        </view>
      </view>
    </view>

    <view class="card submit-card">
      <text class="title">收货了，交个订单</text>
      <text class="muted block">填订单号，选一张已收货截图就好。</text>
      <label class="field" for="order-number">订单号</label>
      <input id="order-number" v-model="orderNo" maxlength="64" placeholder="粘贴完整订单号" :disabled="busy" />
      <text class="field">已收货截图</text>
      <button class="proof-picker" :disabled="busy" @click="selectProof">
        <image v-if="proof.path" :src="proof.path" class="proof-thumb" mode="aspectFit" />
        <text class="block">{{ proof.path ? '已选好 · 点这里换一张' : '＋ 从相册选择截图' }}</text>
      </button>
      <text class="muted block proof-hint">截图需看得清订单号、实付金额和收货状态。</text>
      <view v-if="formError" class="error">{{ formError }}</view>
      <view v-if="success" class="notice">{{ success }}</view>
      <button class="primary" :disabled="busy || !ready || !customer.name || !orderNo.trim() || !proof.base64" :loading="busy" @click="submit">{{ customer.name ? '提交给店主' : '请先保存您的姓名' }}</button>
    </view>

    <button v-if="orders.length" class="record-toggle row" @click="showOrders = !showOrders"><text>我提交的订单（{{ orders.length }}{{ hasMore ? '+' : '' }}）</text><text>{{ showOrders ? '收起' : '查看' }}</text></button>
    <view v-if="showOrders">
      <view v-for="order in orders" :key="order.id" class="card order-record">
        <view class="row"><text class="status">{{ statusName(order.status) }}</text><text class="muted">{{ date(order.createdAt) }}</text></view>
        <text class="muted block wrap">订单 {{ order.orderNo }}</text>
        <text v-if="order.status === 'paid'" class="block">已补贴 {{ money(order.payout) }} 元</text>
        <text v-if="order.note" class="block">{{ order.note }}</text>
        <button v-if="order.status === 'rejected'" class="link" :disabled="busy" @click="resubmit(order)">重新填写这个订单</button>
      </view>
      <button v-if="hasMore" class="secondary" :disabled="loading" @click="loadMore">再看一些</button>
    </view>
    <text class="footer-note">有不明白的，问问店主就好。</text>

  </view>
</template>
<script>
import { api, chooseProof } from '@/services/benefit-service.js'
import { formatMoney, formatDate } from '@/utils/format.js'
export default {
  data() { return { customer: {}, orders: [], hasMore: false, name: '', editName: false, orderNo: '', proof: {}, ready: false, loading: false, busy: false, error: '', formError: '', success: '', showRules: false, showOrders: false, adminBusy: false, taps: 0, lastTap: 0 } },
  onShow() { this.load() },
  async onPullDownRefresh() { await this.load(); uni.stopPullDownRefresh() },
  onHide() { this.taps = 0 },
  methods: {
    money: formatMoney,
    date(value) { return formatDate(value).replace(/^\d{4}年/, '') },
    statusName(value) { return { pending: '等店主核实', processing: '店主正在办理', paid: '已转账', rejected: '请补充信息' }[value] || '处理中' },
    async load() {
      if (this.loading) return
      this.loading = true; this.error = ''
      try { const data = await api('home'); this.customer = data.customer; this.orders = data.orders; this.hasMore = data.hasMore; this.ready = true }
      catch (e) { this.error = e.message; this.ready = false }
      finally { this.loading = false }
    },
    async loadMore() {
      this.loading = true
      try { const data = await api('home', { offset: this.orders.length }); this.orders.push(...data.orders); this.hasMore = data.hasMore }
      catch (e) { this.error = e.message }
      finally { this.loading = false }
    },
    async saveName() {
      this.busy = true; this.formError = ''
      try { await api('saveName', { name: this.name }); this.customer.name = this.name.trim(); this.editName = false; uni.showToast({ title: '姓名已保存', icon: 'success' }) }
      catch (e) { this.formError = e.message }
      finally { this.busy = false }
    },
    async selectProof() {
      this.formError = ''; this.success = ''
      try {
        const consent = await uni.showModal({ title: '仅用于核实购物补贴', content: '截图会交给店主及授权管理员核实，处理完成后保留 90 天。请遮住地址、电话等无关信息。', confirmText: '同意选择', cancelText: '暂不选择' })
        if (!consent.confirm) return
        this.proof = await chooseProof()
      } catch (e) { if (!/cancel/.test(e.errMsg || e.message || '')) this.formError = e.message || '没有选好截图，请重试' }
    },
    async submit() {
      if (this.busy) return
      this.busy = true; this.formError = ''; this.success = ''
      try {
        const order = await api('submitOrder', { orderNo: this.orderNo, base64: this.proof.base64 })
        this.orderNo = ''; this.proof = {}; this.showOrders = true
        this.success = order.status === 'paid' ? '这个订单已处理过，可在下方查看。' : '交好了！店主处理后会在这里更新。'
        await this.load()
      } catch (e) { this.formError = e.message }
      finally { this.busy = false }
    },
    resubmit(order) { this.orderNo = order.orderNo; this.proof = {}; this.success = ''; this.formError = ''; uni.pageScrollTo({ scrollTop: 260, duration: 250 }) },
    tapBrand() {
      const now = Date.now()
      this.taps = now - this.lastTap <= 700 ? this.taps + 1 : 1; this.lastTap = now
      if (this.taps >= 5) { this.taps = 0; this.enterAdmin() }
    },
    async enterAdmin() {
      if (this.adminBusy) return
      this.adminBusy = true
      uni.showLoading({ title: '正在核对身份', mask: true })
      try {
        await api('adminLogin')
        uni.hideLoading()
        uni.navigateTo({ url: '/pages/admin/index' })
      } catch (e) {
        uni.hideLoading()
        uni.showModal({ title: '暂时无法进入管理', content: e.message, showCancel: false, confirmText: '知道了' })
      } finally { this.adminBusy = false }
    }
  }
}
</script>
<style scoped>
.brand-row { display: flex; align-items: center; gap: 18rpx; margin: 8rpx 0 30rpx; }
.brand-icon { width: 80rpx; height: 80rpx; border-radius: 22rpx; flex-shrink: 0; }
.brand-name { display: block; font-size: 36rpx; font-weight: 700; }
.brand-row .muted { font-size: 26rpx; }
.brand-row .link { font-size: 28rpx; }
.balance-panel { background: #315A3F; color: #FFF; border-radius: 30rpx; padding: 32rpx; margin-bottom: 26rpx; }
.balance-label { font-size: 34rpx; color: #EEF2E9; }
.balance-value { font-size: 92rpx; font-weight: 650; letter-spacing: -2rpx; line-height: 1.4; overflow-wrap: anywhere; }
.unit { margin-left: 16rpx; font-size: 30rpx; font-weight: 400; letter-spacing: 0; }
.balance-note { display: block; color: #E0E9DC; font-size: 28rpx; }
.identity { border-top: 2rpx solid #67806B; margin-top: 26rpx; padding-top: 22rpx; }
.customer-name { font-size: 36rpx; font-weight: 600; }
.member-no { color: #E0E9DC; font-size: 24rpx; }
.name-edit, .name-save { background: #EDF2E9; color: #254A32; font-size: 30rpx; padding: 12rpx 20rpx; min-height: 88rpx; border-radius: 14rpx; flex-shrink: 0; }
.name-label { display: block; margin-bottom: 14rpx; font-size: 29rpx; }
.identity input { font-size: 32rpx; min-width: 0; }
.proof-picker { width: 100%; min-height: 132rpx; border: 2rpx dashed #8D9E84; background: #F7F9F3; border-radius: 18rpx; color: #315A3F; padding: 24rpx 12rpx; font-size: 34rpx; }
.proof-thumb { display: block; margin: 0 auto 16rpx; width: 100%; height: 230rpx; }
.proof-hint { margin: 14rpx 0 28rpx; font-size: 28rpx; }
.record-toggle { width: 100%; padding: 16rpx 6rpx; background: transparent; font-size: 30rpx; color: #4F5A4E; margin: 0 0 16rpx; }
.status { color: #315A3F; font-weight: 600; }
.order-record .muted { font-size: 28rpx; }
.footer-note { display: block; text-align: center; color: #6E746A; font-size: 28rpx; padding: 12rpx 0; }
.rules > .block { margin-top: 22rpx; }
</style>

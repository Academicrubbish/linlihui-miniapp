<template>
	<view class="home">
		<view class="topbar">
			<view class="brand" aria-label="邻里惠">
				<view class="brand-mark">邻</view>
				<view>
					<text class="brand-name">邻里惠</text>
					<text class="brand-subtitle">熟客福利小助手</text>
				</view>
			</view>
			<view class="demo-badge">演示模式</view>
		</view>

		<view class="screen home-screen">
			<view class="welcome-row">
				<view>
					<text class="eyebrow">今日福利</text>
					<text class="welcome-title">{{ greeting }}，{{ dashboard.customer.name }}</text>
				</view>
				<view class="rule-link" @click="goRules">规则说明 <text class="arrow">›</text></view>
			</view>

			<view class="balance-card">
				<view class="soft-orb orb-one"></view>
				<view class="soft-orb orb-two"></view>
				<view class="balance-content">
					<text class="balance-label">可以申请的购物补贴</text>
					<view class="balance-number">
						<text class="currency">¥</text>
						<text class="amount">{{ money(dashboard.account.availableCents) }}</text>
					</view>
					<view v-if="dashboard.account.frozenCents > 0" class="frozen-note">
						另有 ¥{{ money(dashboard.account.frozenCents) }} 正在审核
					</view>
					<button class="hero-button" @click="goApply">
						<text>申请购物补贴</text>
						<text class="hero-arrow">→</text>
					</button>
				</view>
			</view>

			<view class="trust-row" aria-label="福利特点">
				<view class="trust-item"><view class="trust-dot"></view><text>免费发放</text></view>
				<view class="trust-item"><view class="trust-dot"></view><text>笔笔可查</text></view>
				<view class="trust-item"><view class="trust-dot"></view><text>不拉人头</text></view>
			</view>

			<view class="section-heading">
				<text class="section-title">本期活动</text>
				<text class="activity-date">至 {{ shortDate(dashboard.activity.validUntil) }}</text>
			</view>
			<view class="activity-card card">
				<view class="activity-index">02</view>
				<view class="activity-copy">
					<text class="activity-name">{{ dashboard.activity.name }}</text>
					<text class="activity-summary">{{ dashboard.activity.summary }}</text>
					<view class="choice-row">
						<view class="choice muted">一桶桶面</view>
						<text class="or-text">或者</text>
						<view class="choice active">¥{{ money(dashboard.activity.benefitCents) }} 福利额度</view>
					</view>
					<text class="choice-hint">到店时自己选，不强制使用小程序</text>
				</view>
			</view>

			<view class="section-heading"><text class="section-title">办事入口</text></view>
			<view class="action-grid">
				<view class="action-card card" @click="goLedger">
					<view class="action-icon ledger-icon"><text>账</text></view>
					<text class="action-title">福利明细</text>
					<text class="action-description">每笔来源都能查</text>
					<text class="action-arrow">→</text>
				</view>
				<view class="action-card card" @click="goApplications">
					<view class="action-icon application-icon"><text>审</text></view>
					<text class="action-title">申请进度</text>
					<text class="action-description">看看审核到哪一步</text>
					<view v-if="dashboard.pendingCount" class="count-badge">{{ dashboard.pendingCount }}</view>
					<text class="action-arrow">→</text>
				</view>
			</view>

			<view class="section-heading">
				<text class="section-title">最近记录</text>
				<view class="text-link" @click="goLedger">查看全部</view>
			</view>
			<view class="record-list card">
				<view v-for="(item, index) in dashboard.recentLedgers" :key="item.id" class="record-item" :class="{ 'with-divider': index > 0 }">
					<view class="record-symbol" :class="item.amountCents < 0 ? 'minus' : 'plus'">{{ item.amountCents < 0 ? '−' : '+' }}</view>
					<view class="record-main">
						<text class="record-title">{{ item.title }}</text>
						<text class="record-meta">{{ shortDate(item.createdAt) }} · {{ item.note }}</text>
					</view>
					<text class="record-amount" :class="{ negative: item.amountCents < 0 }">{{ item.amountCents < 0 ? '−' : '+' }}¥{{ money(Math.abs(item.amountCents)) }}</text>
				</view>
			</view>

			<view class="promise-card">
				<view class="promise-mark">✓</view>
				<view>
					<text class="promise-title">这不是投资，也不是虚拟货币</text>
					<text class="promise-copy">福利由店主免费发放，不能充值、转让或升值。只按真实订单申请补贴。</text>
				</view>
			</view>

			<view class="owner-entry" @click="goAdmin">我是店主，进入工作台 <text>›</text></view>
		</view>
	</view>
</template>

<script>
	import { getDashboard } from '@/services/benefit-service.js'
	import { formatMoney, formatDate } from '@/utils/format.js'

	export default {
		data() {
			return {
				dashboard: {
					customer: { name: '您好' },
					account: { availableCents: 0, frozenCents: 0 },
					activity: { name: '', summary: '', validUntil: '', benefitCents: 0 },
					recentLedgers: [],
					pendingCount: 0
				}
			}
		},
		computed: {
			greeting() {
				const hour = new Date().getHours()
				if (hour < 11) return '早上好'
				if (hour < 14) return '中午好'
				if (hour < 18) return '下午好'
				return '晚上好'
			}
		},
		onShow() {
			this.dashboard = getDashboard()
		},
		methods: {
			money: formatMoney,
			shortDate(value) {
				return formatDate(value).replace(/^\d{4}年/, '')
			},
			goApply() { uni.navigateTo({ url: '/pages/subsidy/apply' }) },
			goRules() { uni.navigateTo({ url: '/pages/rules/index' }) },
			goLedger() { uni.switchTab({ url: '/pages/ledger/index' }) },
			goApplications() { uni.switchTab({ url: '/pages/applications/index' }) },
			goAdmin() { uni.navigateTo({ url: '/pages/admin/index' }) }
		}
	}
</script>

<style scoped>
	.home { min-height: 100vh; background: #F6F1E7; }
	.topbar { padding: calc(var(--status-bar-height) + 20rpx) 32rpx 20rpx; display: flex; align-items: center; justify-content: space-between; background: rgba(255, 253, 248, 0.94); border-bottom: 2rpx solid rgba(23, 35, 29, 0.06); }
	.brand { display: flex; align-items: center; gap: 18rpx; }
	.brand-mark { width: 68rpx; height: 68rpx; display: flex; align-items: center; justify-content: center; border-radius: 22rpx 22rpx 8rpx 22rpx; background: #176044; color: #FFFFFF; font-size: 34rpx; font-weight: 760; box-shadow: 0 10rpx 24rpx rgba(23, 96, 68, 0.2); }
	.brand-name, .brand-subtitle { display: block; }
	.brand-name { font-size: 32rpx; font-weight: 780; line-height: 1.2; color: #17231D; letter-spacing: 2rpx; }
	.brand-subtitle { margin-top: 4rpx; font-size: 22rpx; color: #708078; }
	.home-screen { padding-top: 36rpx; padding-bottom: calc(150rpx + env(safe-area-inset-bottom)); }
	.welcome-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 24rpx; margin: 0 4rpx 26rpx; }
	.welcome-title { display: block; font-size: 43rpx; line-height: 1.2; font-weight: 760; color: #17231D; }
	.rule-link { min-height: 72rpx; flex-shrink: 0; display: flex; align-items: center; font-size: 27rpx; font-weight: 650; color: #176044; }
	.arrow { margin-left: 8rpx; font-size: 38rpx; font-weight: 400; }
	.balance-card { position: relative; overflow: hidden; min-height: 520rpx; padding: 48rpx 42rpx 40rpx; border-radius: 42rpx; background: linear-gradient(145deg, #1F7253 0%, #104936 100%); box-shadow: 0 28rpx 64rpx rgba(23, 72, 54, 0.22); color: #FFFFFF; }
	.soft-orb { position: absolute; border-radius: 999rpx; background: rgba(255, 221, 170, 0.13); }
	.orb-one { width: 310rpx; height: 310rpx; right: -100rpx; top: -80rpx; }
	.orb-two { width: 170rpx; height: 170rpx; right: 80rpx; bottom: -80rpx; }
	.balance-content { position: relative; z-index: 1; }
	.balance-label { display: block; font-size: 29rpx; color: rgba(255, 255, 255, 0.78); }
	.balance-number { display: flex; align-items: flex-start; margin-top: 12rpx; line-height: 1; }
	.currency { margin: 18rpx 12rpx 0 0; font-size: 38rpx; font-weight: 620; }
	.amount { font-size: 104rpx; font-weight: 780; letter-spacing: -5rpx; }
	.frozen-note { display: inline-flex; min-height: 52rpx; align-items: center; margin-top: 22rpx; padding: 0 18rpx; border-radius: 999rpx; background: rgba(255, 255, 255, 0.13); font-size: 25rpx; color: #F6F2E8; }
	.hero-button { width: 100%; min-height: 108rpx; display: flex; align-items: center; justify-content: space-between; margin-top: 42rpx; padding: 0 34rpx; border-radius: 28rpx; background: #FFF6E8; color: #164C38; font-size: 34rpx; font-weight: 760; box-shadow: 0 14rpx 30rpx rgba(4, 27, 19, 0.18); }
	.hero-arrow { width: 52rpx; height: 52rpx; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #EAC46F; font-size: 31rpx; }
	.trust-row { display: flex; align-items: center; justify-content: space-around; margin: 26rpx 2rpx 0; padding: 22rpx 14rpx; border-radius: 24rpx; background: rgba(255, 253, 248, 0.72); color: #526059; font-size: 26rpx; font-weight: 600; }
	.trust-item { display: flex; align-items: center; gap: 10rpx; }
	.trust-dot { width: 10rpx; height: 10rpx; border-radius: 50%; background: #D57B3E; }
	.activity-date { font-size: 26rpx; color: #6F7A73; }
	.activity-card { position: relative; overflow: hidden; display: flex; gap: 28rpx; padding: 34rpx 30rpx; }
	.activity-index { flex: 0 0 74rpx; height: 74rpx; display: flex; align-items: center; justify-content: center; border-radius: 24rpx 24rpx 8rpx 24rpx; background: #F7D698; color: #653D18; font-size: 28rpx; font-weight: 780; }
	.activity-copy { min-width: 0; flex: 1; }
	.activity-name, .activity-summary, .choice-hint { display: block; }
	.activity-name { font-size: 34rpx; font-weight: 750; color: #203129; }
	.activity-summary { margin-top: 10rpx; font-size: 28rpx; line-height: 1.6; color: #5B6861; }
	.choice-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10rpx; margin-top: 24rpx; }
	.choice { min-height: 58rpx; display: flex; align-items: center; padding: 0 18rpx; border-radius: 18rpx; font-size: 25rpx; font-weight: 680; }
	.choice.muted { background: #F0EEE7; color: #5C655F; }
	.choice.active { background: #E1F0E5; color: #17583F; }
	.or-text { font-size: 23rpx; color: #909990; }
	.choice-hint { margin-top: 18rpx; font-size: 25rpx; color: #7B847E; }
	.action-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20rpx; }
	.action-card { position: relative; min-height: 286rpx; padding: 28rpx; }
	.action-icon { width: 68rpx; height: 68rpx; display: flex; align-items: center; justify-content: center; border-radius: 22rpx; font-size: 26rpx; font-weight: 780; }
	.ledger-icon { background: #E1F0E5; color: #176044; }
	.application-icon { background: #FBE7D5; color: #A24F20; }
	.action-title, .action-description { display: block; }
	.action-title { margin-top: 26rpx; font-size: 32rpx; font-weight: 730; color: #213129; }
	.action-description { margin-top: 8rpx; padding-right: 16rpx; font-size: 25rpx; line-height: 1.5; color: #707A74; }
	.action-arrow { position: absolute; right: 26rpx; bottom: 24rpx; font-size: 34rpx; color: #35634E; }
	.count-badge { position: absolute; right: 22rpx; top: 22rpx; min-width: 42rpx; height: 42rpx; display: flex; align-items: center; justify-content: center; padding: 0 10rpx; border-radius: 999rpx; background: #B95D2C; color: #FFFFFF; font-size: 23rpx; font-weight: 750; }
	.record-list { padding: 8rpx 30rpx; }
	.record-item { display: flex; align-items: center; min-height: 142rpx; padding: 24rpx 0; }
	.record-item.with-divider { border-top: 2rpx solid #ECEBE5; }
	.record-symbol { flex: 0 0 62rpx; height: 62rpx; display: flex; align-items: center; justify-content: center; border-radius: 20rpx; background: #E1F0E5; color: #176044; font-size: 34rpx; font-weight: 650; }
	.record-symbol.minus { background: #FBE7DE; color: #9B4526; }
	.record-main { min-width: 0; flex: 1; padding: 0 20rpx; }
	.record-title, .record-meta { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.record-title { font-size: 29rpx; font-weight: 680; color: #223129; }
	.record-meta { margin-top: 6rpx; font-size: 24rpx; color: #7A847D; }
	.record-amount { flex-shrink: 0; font-size: 30rpx; font-weight: 750; color: #176044; }
	.record-amount.negative { color: #9B4526; }
	.promise-card { display: flex; gap: 20rpx; margin-top: 34rpx; padding: 30rpx; border-radius: 28rpx; background: #E9EEE8; }
	.promise-mark { flex: 0 0 54rpx; height: 54rpx; display: flex; align-items: center; justify-content: center; border: 3rpx solid #3B765D; border-radius: 50%; color: #176044; font-size: 28rpx; font-weight: 800; }
	.promise-title, .promise-copy { display: block; }
	.promise-title { font-size: 29rpx; font-weight: 720; color: #26372E; }
	.promise-copy { margin-top: 8rpx; font-size: 25rpx; line-height: 1.6; color: #607067; }
	.owner-entry { min-height: 100rpx; display: flex; align-items: center; justify-content: center; margin-top: 24rpx; font-size: 27rpx; font-weight: 650; color: #637069; }
	.owner-entry text { margin-left: 12rpx; font-size: 38rpx; }

	@media (max-width: 360px) {
		.amount { font-size: 88rpx; }
		.activity-card { gap: 20rpx; padding: 30rpx 24rpx; }
		.action-grid { gap: 14rpx; }
		.action-card { padding: 24rpx; }
		.trust-row { font-size: 24rpx; }
	}
</style>

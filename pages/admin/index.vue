<template>
	<view class="admin-page">
		<view class="admin-hero">
			<view class="hero-top">
				<view>
					<text class="admin-kicker">店主工作台</text>
					<text class="admin-title">今天要处理的事</text>
				</view>
				<view class="demo-badge">演示数据</view>
			</view>
			<view class="task-summary">
				<view class="summary-item">
					<text class="summary-number">{{ dashboard.pendingCount }}</text>
					<text class="summary-label">待审核申请</text>
				</view>
				<view class="summary-divider"></view>
				<view class="summary-item">
					<text class="summary-number">¥{{ money(dashboard.pendingCents) }}</text>
					<text class="summary-label">待核对金额</text>
				</view>
				<view class="summary-divider"></view>
				<view class="summary-item">
					<text class="summary-number">¥{{ money(dashboard.todayGrantCents) }}</text>
					<text class="summary-label">今日已发福利</text>
				</view>
			</view>
		</view>

		<view class="screen admin-screen">
			<view class="main-actions">
				<view class="main-action grant-action" @click="goGrant">
					<view class="action-mark">发</view>
					<view class="action-copy">
						<text class="action-title">给顾客发福利</text>
						<text class="action-text">选择顾客、金额和原因</text>
					</view>
					<text class="chevron">›</text>
				</view>
				<view class="main-action review-action" @click="goReview">
					<view class="action-mark">审</view>
					<view class="action-copy">
						<text class="action-title">审核购物申请</text>
						<text class="action-text">{{ dashboard.pendingCount ? '有 ' + dashboard.pendingCount + ' 笔等待处理' : '目前没有待处理申请' }}</text>
					</view>
					<view v-if="dashboard.pendingCount" class="task-badge">{{ dashboard.pendingCount }}</view>
					<text class="chevron">›</text>
				</view>
			</view>

			<view class="section-heading">
				<text class="section-title">熟客概览</text>
				<text class="customer-count">{{ dashboard.customers.length }} 位演示顾客</text>
			</view>
			<view class="customer-list card">
				<view v-for="(customer, index) in dashboard.customers" :key="customer.id" class="customer-row" :class="{ divided: index > 0 }">
					<view class="avatar">{{ customer.name.slice(0, 1) }}</view>
					<view class="customer-copy">
						<text class="customer-name">{{ customer.name }}</text>
						<text class="customer-mobile">{{ customer.mobile }}</text>
					</view>
					<view class="customer-balance">
						<text class="balance-label">可用</text>
						<text class="balance-value">¥{{ money(customer.account.availableCents) }}</text>
					</view>
				</view>
			</view>

			<view class="security-card">
				<view class="security-icon">锁</view>
				<view>
					<text class="security-title">正式上线前必须加店主身份验证</text>
					<text class="security-copy">当前入口只用于本地演示。配置微信 AppID 后，将由云端校验管理员身份，不能靠“藏住按钮”保护数据。</text>
				</view>
			</view>

			<button class="reset-button" @click="confirmReset">恢复初始演示数据</button>
		</view>
	</view>
</template>

<script>
	import { getAdminDashboard, resetDemoData } from '@/services/benefit-service.js'
	import { formatMoney } from '@/utils/format.js'

	export default {
		data() {
			return {
				dashboard: { customers: [], pendingCount: 0, pendingCents: 0, todayGrantCents: 0 }
			}
		},
		onShow() {
			this.refresh()
		},
		methods: {
			money: formatMoney,
			refresh() { this.dashboard = getAdminDashboard() },
			goGrant() { uni.navigateTo({ url: '/pages/admin/grant' }) },
			goReview() { uni.navigateTo({ url: '/pages/admin/review' }) },
			confirmReset() {
				uni.showModal({
					title: '恢复初始演示数据？',
					content: '你刚才在演示模式中的发放和审核记录都会被清空。正式数据不会使用这个按钮。',
					confirmText: '确认恢复',
					confirmColor: '#A74226',
					success: result => {
						if (!result.confirm) return
						resetDemoData()
						this.refresh()
						uni.showToast({ title: '已经恢复', icon: 'success' })
					}
				})
			}
		}
	}
</script>

<style scoped>
	.admin-page { min-height: 100vh; background: #F6F1E7; }
	.admin-hero { padding: 38rpx 32rpx 46rpx; background: #173F30; color: #FFFFFF; }
	.hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20rpx; }
	.admin-kicker, .admin-title { display: block; }
	.admin-kicker { font-size: 25rpx; font-weight: 700; color: #EBC985; letter-spacing: 3rpx; }
	.admin-title { margin-top: 10rpx; font-size: 46rpx; font-weight: 770; }
	.task-summary { display: flex; align-items: stretch; margin-top: 38rpx; border-radius: 28rpx; background: rgba(255,255,255,.08); }
	.summary-item { min-width: 0; flex: 1; padding: 26rpx 12rpx; text-align: center; }
	.summary-number, .summary-label { display: block; }
	.summary-number { font-size: 35rpx; font-weight: 770; color: #FFFFFF; white-space: nowrap; }
	.summary-label { margin-top: 6rpx; font-size: 22rpx; color: rgba(255,255,255,.62); }
	.summary-divider { width: 2rpx; margin: 22rpx 0; background: rgba(255,255,255,.12); }
	.admin-screen { padding-top: 28rpx; }
	.main-actions { display: flex; flex-direction: column; gap: 18rpx; }
	.main-action { min-height: 144rpx; display: flex; align-items: center; gap: 22rpx; padding: 26rpx; border-radius: 30rpx; box-shadow: 0 14rpx 40rpx rgba(40,55,47,.08); }
	.grant-action { background: #FFF9EE; border: 2rpx solid #EED8AE; }
	.review-action { background: #EEF6F0; border: 2rpx solid #C9DFD0; }
	.action-mark { flex: 0 0 72rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; border-radius: 23rpx; background: #E8C677; color: #50391E; font-size: 28rpx; font-weight: 780; }
	.review-action .action-mark { background: #CFE4D5; color: #174F3A; }
	.action-copy { min-width: 0; flex: 1; }
	.action-title, .action-text { display: block; }
	.action-title { font-size: 32rpx; font-weight: 740; color: #26372F; }
	.action-text { margin-top: 5rpx; font-size: 25rpx; color: #6D7871; }
	.chevron { flex-shrink: 0; font-size: 50rpx; color: #66736B; font-weight: 300; }
	.task-badge { min-width: 46rpx; height: 46rpx; display: flex; align-items: center; justify-content: center; padding: 0 12rpx; border-radius: 999rpx; background: #AF4D2B; color: #FFFFFF; font-size: 24rpx; font-weight: 740; }
	.customer-count { font-size: 25rpx; color: #748078; }
	.customer-list { padding: 6rpx 28rpx; }
	.customer-row { display: flex; align-items: center; min-height: 132rpx; padding: 20rpx 0; }
	.customer-row.divided { border-top: 2rpx solid #ECEBE5; }
	.avatar { flex: 0 0 72rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; border-radius: 25rpx 25rpx 9rpx 25rpx; background: #E2EEE5; color: #176044; font-size: 29rpx; font-weight: 760; }
	.customer-copy { min-width: 0; flex: 1; padding: 0 20rpx; }
	.customer-name, .customer-mobile { display: block; }
	.customer-name { font-size: 30rpx; font-weight: 720; color: #26362E; }
	.customer-mobile { margin-top: 5rpx; font-size: 24rpx; color: #7D8781; }
	.customer-balance { text-align: right; }
	.balance-label, .balance-value { display: block; }
	.balance-label { font-size: 22rpx; color: #858E89; }
	.balance-value { margin-top: 3rpx; font-size: 30rpx; font-weight: 750; color: #176044; }
	.security-card { display: flex; align-items: flex-start; gap: 18rpx; margin-top: 30rpx; padding: 28rpx; border-radius: 26rpx; background: #E7E9E4; }
	.security-icon { flex: 0 0 50rpx; height: 50rpx; display: flex; align-items: center; justify-content: center; border-radius: 18rpx; background: #D0D8D1; color: #405349; font-size: 21rpx; font-weight: 750; }
	.security-title, .security-copy { display: block; }
	.security-title { font-size: 28rpx; font-weight: 720; color: #34463C; }
	.security-copy { margin-top: 8rpx; font-size: 25rpx; line-height: 1.6; color: #647169; }
	.reset-button { min-height: 104rpx; margin-top: 30rpx; background: transparent; font-size: 27rpx; font-weight: 650; color: #7E4A34; }
</style>

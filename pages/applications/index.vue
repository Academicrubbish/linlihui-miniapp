<template>
	<view class="screen tab-screen">
		<view class="page-intro">
			<text class="eyebrow">处理进度</text>
			<text class="page-title">我的申请</text>
			<text class="page-description">每一步都写明白。需要补充材料时，店主会直接说明原因。</text>
		</view>

		<button class="primary-button apply-button" @click="goApply">新建购物补贴申请</button>

		<view v-if="items.length" class="application-list">
			<view v-for="item in items" :key="item.id" class="application-card card">
				<view class="application-head">
					<view>
						<text class="platform">{{ item.platform }}</text>
						<text class="order-number">订单尾号 {{ item.orderNo.slice(-4) }}</text>
					</view>
					<view class="status-pill" :class="'status-' + status(item.status).tone">{{ status(item.status).label }}</view>
				</view>

				<view class="amount-row">
					<view class="amount-block">
						<text class="amount-label">订单实付</text>
						<text class="amount-value">¥{{ money(item.orderAmountCents) }}</text>
					</view>
					<view class="amount-divider"></view>
					<view class="amount-block">
						<text class="amount-label">申请补贴</text>
						<text class="amount-value highlight">¥{{ money(item.requestedCents) }}</text>
					</view>
				</view>

				<view class="progress">
					<view class="progress-step done">
						<view class="step-dot">✓</view>
						<text>已提交</text>
					</view>
					<view class="progress-line" :class="{ done: item.status !== 'pending' }"></view>
					<view class="progress-step" :class="{ done: item.status !== 'pending', rejected: item.status === 'rejected' }">
						<view class="step-dot">{{ item.status === 'pending' ? '2' : (item.status === 'rejected' ? '!' : '✓') }}</view>
						<text>{{ item.status === 'rejected' ? '已退回' : '已审核' }}</text>
					</view>
					<view class="progress-line" :class="{ done: item.status === 'paid' }"></view>
					<view class="progress-step" :class="{ done: item.status === 'paid' }">
						<view class="step-dot">{{ item.status === 'paid' ? '✓' : '3' }}</view>
						<text>已发放</text>
					</view>
				</view>

				<view class="status-explain">
					<text class="status-hint">{{ status(item.status).hint }}</text>
					<text v-if="item.reviewNote" class="review-note">店主说明：{{ item.reviewNote }}</text>
					<text class="submit-time">提交于 {{ date(item.createdAt) }}</text>
				</view>
			</view>
		</view>

		<view v-else class="empty-state card">
			<view class="empty-illustration">单</view>
			<text class="empty-title">还没有提交过申请</text>
			<text class="empty-description">确认收货后，准备好订单号和订单截图就可以申请。</text>
		</view>
	</view>
</template>

<script>
	import { getApplications } from '@/services/benefit-service.js'
	import { formatMoney, formatDate, applicationStatus } from '@/utils/format.js'

	export default {
		data() {
			return { items: [] }
		},
		onShow() {
			this.items = getApplications()
		},
		methods: {
			money: formatMoney,
			date(value) { return formatDate(value, true) },
			status(value) { return applicationStatus[value] || applicationStatus.pending },
			goApply() { uni.navigateTo({ url: '/pages/subsidy/apply' }) }
		}
	}
</script>

<style scoped>
	.tab-screen { padding-bottom: calc(150rpx + env(safe-area-inset-bottom)); }
	.apply-button { margin-bottom: 34rpx; }
	.application-list { display: flex; flex-direction: column; gap: 24rpx; }
	.application-card { padding: 30rpx; }
	.application-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20rpx; }
	.platform, .order-number { display: block; }
	.platform { font-size: 34rpx; font-weight: 750; color: #203129; }
	.order-number { margin-top: 6rpx; font-size: 24rpx; color: #7B857F; }
	.amount-row { display: flex; align-items: center; margin-top: 30rpx; padding: 26rpx; border-radius: 22rpx; background: #F5F3EC; }
	.amount-block { flex: 1; }
	.amount-label, .amount-value { display: block; }
	.amount-label { font-size: 24rpx; color: #77817B; }
	.amount-value { margin-top: 6rpx; font-size: 36rpx; font-weight: 750; color: #293830; }
	.amount-value.highlight { color: #176044; }
	.amount-divider { width: 2rpx; height: 64rpx; margin: 0 28rpx; background: #D7DCD7; }
	.progress { display: flex; align-items: flex-start; margin: 36rpx 8rpx 0; }
	.progress-step { width: 92rpx; display: flex; flex-direction: column; align-items: center; gap: 10rpx; text-align: center; font-size: 23rpx; color: #8A938E; }
	.step-dot { width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; border: 3rpx solid #C7CDC9; border-radius: 50%; background: #FFFDF8; font-size: 22rpx; font-weight: 750; }
	.progress-step.done { color: #176044; font-weight: 650; }
	.progress-step.done .step-dot { border-color: #176044; background: #176044; color: #FFFFFF; }
	.progress-step.rejected { color: #983F23; }
	.progress-step.rejected .step-dot { border-color: #B34C2F; background: #B34C2F; }
	.progress-line { flex: 1; height: 4rpx; margin-top: 23rpx; background: #D6DBD7; }
	.progress-line.done { background: #358568; }
	.status-explain { margin-top: 28rpx; padding-top: 24rpx; border-top: 2rpx solid #ECEBE5; }
	.status-hint, .review-note, .submit-time { display: block; }
	.status-hint { font-size: 27rpx; font-weight: 650; color: #425149; }
	.review-note { margin-top: 10rpx; padding: 18rpx 20rpx; border-radius: 16rpx; background: #FFF0E8; font-size: 26rpx; color: #7E442D; }
	.submit-time { margin-top: 12rpx; font-size: 23rpx; color: #8A938E; }
	.empty-illustration { width: 92rpx; height: 92rpx; display: flex; align-items: center; justify-content: center; margin: 0 auto 24rpx; border-radius: 30rpx 30rpx 10rpx 30rpx; background: #E1F0E5; color: #176044; font-size: 34rpx; font-weight: 780; }
</style>

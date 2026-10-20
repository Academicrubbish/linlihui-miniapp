<template>
	<view class="screen">
		<view class="page-intro">
			<text class="eyebrow">店主操作</text>
			<text class="page-title">审核购物申请</text>
			<text class="page-description">对照订单截图逐项核对。看不清楚就退回说明，不要凭印象通过。</text>
		</view>

		<view v-if="items.length" class="review-list">
			<view v-for="item in items" :key="item.id" class="review-card card">
				<view class="review-head">
					<view class="customer-avatar">{{ item.customer.name.slice(0, 1) }}</view>
					<view class="customer-copy">
						<text class="customer-name">{{ item.customer.name }}</text>
						<text class="customer-mobile">{{ item.customer.mobile }}</text>
					</view>
					<view class="status-pill" :class="item.status === 'approved' ? 'status-success' : 'status-warning'">
						{{ item.status === 'approved' ? '待线下发放' : '待审核' }}
					</view>
				</view>

				<view class="order-panel">
					<view class="order-row">
						<text class="order-label">购物渠道</text>
						<text class="order-value">{{ item.platform }}</text>
					</view>
					<view class="order-row">
						<text class="order-label">订单号</text>
						<text class="order-value order-no">{{ item.orderNo }}</text>
					</view>
					<view class="order-row">
						<text class="order-label">订单实付</text>
						<text class="order-value">¥{{ money(item.orderAmountCents) }}</text>
					</view>
					<view class="order-row emphasis">
						<text class="order-label">申请补贴</text>
						<text class="order-value">¥{{ money(item.requestedCents) }}</text>
					</view>
				</view>

				<view class="proof-placeholder">
					<view class="proof-icon">图</view>
					<view class="proof-copy">
						<text class="proof-title">订单凭证已提交</text>
						<text class="proof-note">演示模式只记录凭证状态，不上传图片</text>
					</view>
				</view>

				<view v-if="item.note" class="customer-note">顾客说明：{{ item.note }}</view>
				<text class="submit-time">提交时间：{{ date(item.createdAt) }}</text>

				<view v-if="item.status === 'pending'" class="check-list">
					<text class="check-title">通过前请确认</text>
					<view v-for="check in checks" :key="check" class="check-item">
						<view class="check-box">✓</view>
						<text>{{ check }}</text>
					</view>
				</view>

				<view v-if="item.status === 'pending'" class="review-actions">
					<button class="secondary-button approve-button" @click="confirmApprove(item)">订单无误，通过</button>
					<button class="reject-link" @click="openReject(item)">看不清或有问题，退回</button>
				</view>
				<view v-else class="review-actions">
					<button class="primary-button" @click="confirmPaid(item)">已经线下发放，标记完成</button>
				</view>
			</view>
		</view>

		<view v-else class="empty-state card">
			<view class="done-mark">✓</view>
			<text class="empty-title">都处理完了</text>
			<text class="empty-description">目前没有待审核或待发放的申请。</text>
		</view>

		<view v-if="rejectingItem" class="modal-mask" @click.self="closeReject">
			<view class="reject-sheet">
				<text class="sheet-title">告诉顾客为什么退回</text>
				<text class="sheet-description">说明越具体，顾客越容易重新提交。</text>
				<view class="reason-list">
					<view v-for="reason in rejectReasons" :key="reason" class="reason-option" :class="{ selected: rejectReason === reason }" @click="rejectReason = reason">{{ reason }}</view>
				</view>
				<textarea v-model="rejectReason" class="reason-textarea" maxlength="100" placeholder="也可以自己填写原因"></textarea>
				<button class="danger-button" :disabled="rejectReason.length < 2" @click="submitReject">确认退回</button>
				<button class="cancel-button" @click="closeReject">取消</button>
			</view>
		</view>
	</view>
</template>

<script>
	import { getPendingApplications, reviewApplication, markApplicationPaid } from '@/services/benefit-service.js'
	import { formatMoney, formatDate } from '@/utils/format.js'

	export default {
		data() {
			return {
				items: [],
				checks: ['订单号和顾客提交的一致', '实付金额不低于申请补贴', '订单状态已经确认收货'],
				rejectReasons: ['订单截图看不清', '订单还没有确认收货', '订单号或金额不一致'],
				rejectingItem: null,
				rejectReason: ''
			}
		},
		onShow() {
			this.refresh()
		},
		methods: {
			money: formatMoney,
			date(value) { return formatDate(value, true) },
			refresh() { this.items = getPendingApplications() },
			confirmApprove(item) {
				uni.showModal({
					title: '确认通过这笔申请？',
					content: `${item.customer.name}将使用 ¥${formatMoney(item.requestedCents)} 福利额度。通过后会立即记入明细，下一步需要线下发放。`,
					confirmText: '确认通过',
					cancelText: '再核对一下',
					success: result => {
						if (!result.confirm) return
						try {
							reviewApplication(item.id, 'approve')
							this.refresh()
							uni.showToast({ title: '审核已通过', icon: 'success' })
						} catch (error) {
							uni.showModal({ title: '操作失败', content: error.message || '请刷新后重试', showCancel: false })
						}
					}
				})
			},
			openReject(item) {
				this.rejectingItem = item
				this.rejectReason = ''
			},
			closeReject() {
				this.rejectingItem = null
				this.rejectReason = ''
			},
			submitReject() {
				if (!this.rejectingItem || this.rejectReason.trim().length < 2) return
				try {
					reviewApplication(this.rejectingItem.id, 'reject', this.rejectReason)
					this.closeReject()
					this.refresh()
					uni.showToast({ title: '已经退回', icon: 'none' })
				} catch (error) {
					uni.showModal({ title: '操作失败', content: error.message || '请刷新后重试', showCancel: false })
				}
			},
			confirmPaid(item) {
				uni.showModal({
					title: '确认已经发放？',
					content: `请确认已经通过线下约定方式向${item.customer.name}发放 ¥${formatMoney(item.requestedCents)}。这个按钮不会自动转账。`,
					confirmText: '已经发放',
					cancelText: '还没有',
					success: result => {
						if (!result.confirm) return
						try {
							markApplicationPaid(item.id)
							this.refresh()
							uni.showToast({ title: '已标记完成', icon: 'success' })
						} catch (error) {
							uni.showModal({ title: '操作失败', content: error.message || '请刷新后重试', showCancel: false })
						}
					}
				})
			}
		}
	}
</script>

<style scoped>
	.review-list { display: flex; flex-direction: column; gap: 26rpx; }
	.review-card { padding: 30rpx; }
	.review-head { display: flex; align-items: center; gap: 16rpx; }
	.customer-avatar { flex: 0 0 68rpx; height: 68rpx; display: flex; align-items: center; justify-content: center; border-radius: 22rpx 22rpx 8rpx 22rpx; background: #E1F0E5; color: #176044; font-size: 28rpx; font-weight: 760; }
	.customer-copy { min-width: 0; flex: 1; }
	.customer-name, .customer-mobile { display: block; }
	.customer-name { font-size: 30rpx; font-weight: 730; color: #24352C; }
	.customer-mobile { margin-top: 3rpx; font-size: 23rpx; color: #7C8680; }
	.order-panel { margin-top: 26rpx; padding: 10rpx 24rpx; border-radius: 22rpx; background: #F4F3ED; }
	.order-row { min-height: 72rpx; display: flex; align-items: center; justify-content: space-between; gap: 20rpx; border-bottom: 2rpx solid #E1E2DD; }
	.order-row:last-child { border-bottom: 0; }
	.order-row.emphasis { color: #176044; font-weight: 720; }
	.order-label { flex-shrink: 0; font-size: 25rpx; color: #727D76; }
	.order-value { min-width: 0; font-size: 28rpx; font-weight: 680; text-align: right; color: #293930; }
	.order-no { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 24rpx; }
	.proof-placeholder { display: flex; align-items: center; gap: 18rpx; margin-top: 18rpx; padding: 22rpx; border: 3rpx dashed #C2CBC4; border-radius: 20rpx; background: #FAFAF6; }
	.proof-icon { flex: 0 0 54rpx; height: 54rpx; display: flex; align-items: center; justify-content: center; border-radius: 17rpx; background: #DFE8E0; color: #365847; font-size: 22rpx; font-weight: 750; }
	.proof-copy { min-width: 0; flex: 1; }
	.proof-title, .proof-note { display: block; }
	.proof-title { font-size: 27rpx; font-weight: 700; color: #34463C; }
	.proof-note { margin-top: 4rpx; font-size: 23rpx; color: #7B857F; }
	.customer-note { margin-top: 18rpx; padding: 18rpx 20rpx; border-radius: 16rpx; background: #FFF1DD; font-size: 25rpx; color: #765037; }
	.submit-time { display: block; margin-top: 16rpx; font-size: 23rpx; color: #858E89; }
	.check-list { margin-top: 26rpx; padding: 24rpx; border-radius: 22rpx; background: #EBF3ED; }
	.check-title { display: block; margin-bottom: 14rpx; font-size: 27rpx; font-weight: 720; color: #2D4939; }
	.check-item { display: flex; align-items: center; gap: 12rpx; min-height: 52rpx; font-size: 25rpx; color: #52655A; }
	.check-box { flex: 0 0 32rpx; height: 32rpx; display: flex; align-items: center; justify-content: center; border-radius: 9rpx; background: #CFE4D5; color: #176044; font-size: 20rpx; font-weight: 780; }
	.review-actions { margin-top: 26rpx; }
	.approve-button { min-height: 104rpx; }
	.reject-link, .cancel-button { width: 100%; min-height: 104rpx; margin-top: 8rpx; background: transparent; font-size: 28rpx; font-weight: 650; color: #914027; }
	.done-mark { width: 88rpx; height: 88rpx; display: flex; align-items: center; justify-content: center; margin: 0 auto 24rpx; border-radius: 50%; background: #DCEDE1; color: #176044; font-size: 40rpx; font-weight: 780; }
	.modal-mask { position: fixed; inset: 0; z-index: 100; display: flex; align-items: flex-end; background: rgba(12,24,18,.54); }
	.reject-sheet { width: 100%; padding: 38rpx 30rpx calc(30rpx + env(safe-area-inset-bottom)); border-radius: 38rpx 38rpx 0 0; background: #FFFDF8; }
	.sheet-title, .sheet-description { display: block; }
	.sheet-title { font-size: 38rpx; font-weight: 760; color: #26362E; }
	.sheet-description { margin-top: 8rpx; font-size: 26rpx; color: #748078; }
	.reason-list { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 26rpx; }
	.reason-option { min-height: 64rpx; display: flex; align-items: center; padding: 0 20rpx; border-radius: 999rpx; background: #F1F1EC; font-size: 25rpx; color: #59655E; }
	.reason-option.selected { background: #F8E3D9; color: #914027; font-weight: 680; }
	.reason-textarea { width: 100%; height: 160rpx; margin: 20rpx 0 24rpx; padding: 20rpx; border: 3rpx solid #DFE2DF; border-radius: 20rpx; background: #FAF9F5; font-size: 28rpx; }
	.cancel-button { color: #657169; }
</style>

<template>
	<view class="screen">
		<view class="page-intro">
			<text class="eyebrow">店主操作</text>
			<text class="page-title">给顾客发福利</text>
			<text class="page-description">先选人，再选金额，最后写清原因。提交后会立即生成一条福利明细。</text>
		</view>

		<view class="form-card card">
			<view class="field">
				<text class="field-label">第一步：选择顾客</text>
				<view class="customer-options">
					<view v-for="customer in customers" :key="customer.id" class="customer-option" :class="{ selected: form.customerId === customer.id }" @click="form.customerId = customer.id">
						<view class="customer-avatar">{{ customer.name.slice(0, 1) }}</view>
						<view class="customer-copy">
							<text class="customer-name">{{ customer.name }}</text>
							<text class="customer-detail">{{ customer.mobile }} · 可用 ¥{{ money(customer.account.availableCents) }}</text>
						</view>
						<view class="select-circle"><text v-if="form.customerId === customer.id">✓</text></view>
					</view>
				</view>
			</view>

			<view class="field">
				<text class="field-label">第二步：选择福利金额</text>
				<view class="amount-options">
					<view v-for="amount in amounts" :key="amount" class="amount-option" :class="{ selected: form.amountCents === amount }" @click="form.amountCents = amount">
						<text class="amount-symbol">¥</text>
						<text class="amount-number">{{ money(amount) }}</text>
					</view>
				</view>
				<view class="custom-amount">
					<text>其他金额</text>
					<view class="custom-input">
						<text>¥</text>
						<input v-model="customAmount" type="digit" placeholder="0.00" @input="useCustomAmount" />
					</view>
				</view>
			</view>

			<view class="field last">
				<text class="field-label">第三步：写清发放原因</text>
				<view class="reason-options">
					<view v-for="reason in reasons" :key="reason" class="reason-chip" :class="{ selected: form.reason === reason }" @click="form.reason = reason">{{ reason }}</view>
				</view>
				<input v-model.trim="form.reason" class="reason-input" maxlength="80" placeholder="也可以自己填写原因" placeholder-class="input-placeholder" />
			</view>
		</view>

		<view class="preview-card" :class="{ ready: canSubmit }">
			<text class="preview-label">即将发放</text>
			<view class="preview-main">
				<text class="preview-name">{{ selectedCustomer ? selectedCustomer.name : '请先选择顾客' }}</text>
				<text class="preview-amount">¥{{ money(form.amountCents) }}</text>
			</view>
			<text class="preview-reason">{{ form.reason || '还没有填写发放原因' }}</text>
		</view>

		<button class="primary-button" :disabled="submitting || !canSubmit" @click="confirmGrant">
			{{ submitting ? '正在发放…' : '确认发放福利' }}
		</button>
		<text class="safety-note">正式上线后，这一步会由云端检查店主身份并记录操作人。</text>
	</view>
</template>

<script>
	import { getCustomers, grantBenefit } from '@/services/benefit-service.js'
	import { formatMoney } from '@/utils/format.js'

	export default {
		data() {
			return {
				customers: [],
				amounts: [500, 1000, 5000],
				reasons: ['日常到店福利', '一周体验活动', '首位体验奖励'],
				customAmount: '',
				form: { customerId: '', amountCents: 0, reason: '' },
				submitting: false
			}
		},
		computed: {
			selectedCustomer() {
				return this.customers.find(item => item.id === this.form.customerId)
			},
			canSubmit() {
				return this.form.customerId && this.form.amountCents > 0 && this.form.reason.length >= 2
			}
		},
		onLoad() {
			this.customers = getCustomers()
		},
		methods: {
			money: formatMoney,
			useCustomAmount() {
				const value = String(this.customAmount).trim()
				if (!/^\d+(\.\d{0,2})?$/.test(value)) {
					this.form.amountCents = 0
					return
				}
				this.form.amountCents = Math.round(Number(value) * 100)
			},
			confirmGrant() {
				if (!this.canSubmit || this.submitting) return
				uni.showModal({
					title: '请再核对一次',
					content: `给${this.selectedCustomer.name}发放 ¥${formatMoney(this.form.amountCents)}，原因是“${this.form.reason}”。发放后会生成记录。`,
					confirmText: '确认发放',
					cancelText: '返回修改',
					success: result => {
						if (result.confirm) this.submit()
					}
				})
			},
			submit() {
				this.submitting = true
				try {
					grantBenefit(this.form)
					uni.showModal({
						title: '发放成功',
						content: `${this.selectedCustomer.name}新增 ¥${formatMoney(this.form.amountCents)} 福利额度，记录已经保存。`,
						showCancel: false,
						confirmText: '返回工作台',
						success: () => uni.navigateBack()
					})
				} catch (error) {
					uni.showModal({ title: '发放失败', content: error.message || '请稍后再试', showCancel: false })
				} finally {
					this.submitting = false
				}
			}
		}
	}
</script>

<style scoped>
	.form-card { padding: 10rpx 30rpx; }
	.field { padding: 32rpx 0; border-bottom: 2rpx solid #E8E8E2; }
	.field.last { border-bottom: 0; }
	.field-label { display: block; margin-bottom: 20rpx; font-size: 31rpx; font-weight: 730; color: #25362D; }
	.customer-options { display: flex; flex-direction: column; gap: 14rpx; }
	.customer-option { min-height: 112rpx; display: flex; align-items: center; gap: 16rpx; padding: 18rpx; border: 3rpx solid #E0E4E0; border-radius: 22rpx; background: #FAF9F5; }
	.customer-option.selected { border-color: #267054; background: #E8F2EB; }
	.customer-avatar { flex: 0 0 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; border-radius: 21rpx 21rpx 7rpx 21rpx; background: #DFE9E1; color: #176044; font-size: 27rpx; font-weight: 760; }
	.customer-copy { min-width: 0; flex: 1; }
	.customer-name, .customer-detail { display: block; }
	.customer-name { font-size: 29rpx; font-weight: 720; color: #25362D; }
	.customer-detail { margin-top: 4rpx; font-size: 23rpx; color: #768079; }
	.select-circle { flex: 0 0 42rpx; height: 42rpx; display: flex; align-items: center; justify-content: center; border: 3rpx solid #B9C1BC; border-radius: 50%; color: #FFFFFF; font-size: 22rpx; font-weight: 760; }
	.customer-option.selected .select-circle { border-color: #176044; background: #176044; }
	.amount-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14rpx; }
	.amount-option { min-height: 116rpx; display: flex; align-items: baseline; justify-content: center; padding: 22rpx 10rpx; border: 3rpx solid #DFE3DF; border-radius: 22rpx; background: #FAF9F5; color: #34443B; }
	.amount-option.selected { border-color: #C28336; background: #FFF0D3; color: #794716; }
	.amount-symbol { margin-right: 4rpx; font-size: 24rpx; font-weight: 700; }
	.amount-number { font-size: 36rpx; font-weight: 780; }
	.custom-amount { min-height: 94rpx; display: flex; align-items: center; justify-content: space-between; margin-top: 14rpx; padding: 0 20rpx; border-radius: 20rpx; background: #F2F1EB; font-size: 27rpx; color: #59665F; }
	.custom-input { width: 210rpx; display: flex; align-items: center; gap: 8rpx; font-size: 29rpx; color: #26372F; }
	.custom-input input { min-width: 0; flex: 1; height: 80rpx; text-align: right; font-size: 31rpx; font-weight: 700; }
	.reason-options { display: flex; flex-wrap: wrap; gap: 12rpx; }
	.reason-chip { min-height: 64rpx; display: flex; align-items: center; padding: 0 20rpx; border-radius: 999rpx; background: #F0F1EC; font-size: 25rpx; color: #59655E; }
	.reason-chip.selected { background: #E1F0E5; color: #176044; font-weight: 680; }
	.reason-input { height: 94rpx; margin-top: 18rpx; padding: 0 22rpx; border: 3rpx solid #DDE2DE; border-radius: 20rpx; background: #FBFAF6; font-size: 28rpx; color: #24342C; }
	.input-placeholder { color: #9AA29D; }
	.preview-card { margin: 24rpx 0; padding: 30rpx; border-radius: 28rpx; background: #E5E7E2; color: #68736C; }
	.preview-card.ready { background: #174F3B; color: #FFFFFF; box-shadow: 0 18rpx 40rpx rgba(23,79,59,.18); }
	.preview-label, .preview-name, .preview-amount, .preview-reason { display: block; }
	.preview-label { font-size: 24rpx; opacity: .7; }
	.preview-main { display: flex; align-items: baseline; justify-content: space-between; gap: 20rpx; margin-top: 10rpx; }
	.preview-name { font-size: 32rpx; font-weight: 730; }
	.preview-amount { font-size: 46rpx; font-weight: 780; }
	.preview-reason { margin-top: 10rpx; font-size: 25rpx; opacity: .75; }
	.safety-note { display: block; margin-top: 18rpx; padding: 0 20rpx; text-align: center; font-size: 24rpx; color: #7A847E; }
</style>

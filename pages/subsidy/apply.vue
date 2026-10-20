<template>
	<view class="screen form-screen">
		<view class="step-header">
			<view class="step active"><view class="step-number">1</view><text>填订单</text></view>
			<view class="step-line"></view>
			<view class="step"><view class="step-number">2</view><text>店主核对</text></view>
			<view class="step-line"></view>
			<view class="step"><view class="step-number">3</view><text>发放补贴</text></view>
		</view>

		<view class="quota-card">
			<view>
				<text class="quota-label">本次最多可申请</text>
				<text class="quota-value">¥{{ money(info.account.availableCents) }}</text>
			</view>
			<text class="quota-note">不会超过订单实付金额</text>
		</view>

		<view class="form-card card">
			<view class="form-heading">
				<text class="form-title">填写订单信息</text>
				<text class="required-note"><text>*</text> 为必填</text>
			</view>

			<view class="field">
				<text class="field-label">购物渠道 <text class="required">*</text></text>
				<view class="channel-grid">
					<view v-for="channel in channels" :key="channel" class="channel-option" :class="{ selected: form.platform === channel }" @click="form.platform = channel">
						<view class="radio-dot"><view v-if="form.platform === channel"></view></view>
						<text>{{ channel }}</text>
					</view>
				</view>
			</view>

			<view class="field">
				<text class="field-label">订单号 <text class="required">*</text></text>
				<input v-model.trim="form.orderNo" class="field-input" maxlength="40" placeholder="复制或填写订单号" placeholder-class="input-placeholder" />
				<text class="field-help">请填写已经确认收货的真实订单。</text>
			</view>

			<view class="field">
				<text class="field-label">订单实付金额 <text class="required">*</text></text>
				<view class="money-input-wrap">
					<text class="money-prefix">¥</text>
					<input v-model="form.orderAmount" class="money-input" type="digit" maxlength="9" placeholder="0.00" placeholder-class="input-placeholder" />
					<text class="money-unit">元</text>
				</view>
				<view v-if="estimatedCents > 0" class="estimate">
					<text>预计申请补贴</text>
					<text class="estimate-value">¥{{ money(estimatedCents) }}</text>
				</view>
			</view>

			<view class="field">
				<text class="field-label">订单凭证 <text class="required">*</text></text>
				<view v-if="!form.proofPath" class="upload-box" @click="chooseProof">
					<view class="upload-plus">+</view>
					<text class="upload-title">添加订单截图</text>
					<text class="upload-help">截图需看清订单号、实付金额和收货状态</text>
				</view>
				<view v-else class="proof-preview">
					<image class="proof-image" :src="form.proofPath" mode="aspectFill"></image>
					<view class="proof-copy">
						<text class="proof-title">订单凭证已添加</text>
						<text class="proof-name">{{ form.proofName }}</text>
						<view class="replace-proof" @click="chooseProof">重新选择</view>
					</view>
				</view>
			</view>

			<view class="field last">
				<text class="field-label">补充说明 <text class="optional">选填</text></text>
				<textarea v-model="form.note" class="field-textarea" maxlength="120" placeholder="例如：购买的是日用品，已经确认收货" placeholder-class="input-placeholder"></textarea>
				<text class="counter">{{ form.note.length }}/120</text>
			</view>
		</view>

		<view class="privacy-note">
			<view class="privacy-mark">安</view>
			<text>订单信息只用于核对本次补贴，不会用于拉人推广。演示模式下图片不会上传云端。</text>
		</view>

		<button class="primary-button submit-button" :disabled="submitting || !canSubmit" @click="confirmSubmit">
			{{ submitting ? '正在提交…' : '确认提交申请' }}
		</button>
		<text class="submit-tip">提交后，申请金额会暂时冻结，审核退回会自动释放。</text>
	</view>
</template>

<script>
	import { getApplicationDraftInfo, submitApplication } from '@/services/benefit-service.js'
	import { formatMoney } from '@/utils/format.js'

	export default {
		data() {
			return {
				info: {
					account: { availableCents: 0 },
					customer: {}
				},
				channels: ['抖音电商', '兴盛优选', '多多买菜', '其他渠道'],
				form: {
					platform: '',
					orderNo: '',
					orderAmount: '',
					proofPath: '',
					proofName: '',
					note: ''
				},
				submitting: false
			}
		},
		computed: {
			orderAmountCents() {
				const normalized = String(this.form.orderAmount).replace(/,/g, '').trim()
				if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return 0
				return Math.round(Number(normalized) * 100)
			},
			estimatedCents() {
				return Math.min(this.orderAmountCents, this.info.account.availableCents)
			},
			canSubmit() {
				return this.form.platform && this.form.orderNo.length >= 6 && this.orderAmountCents > 0 && this.form.proofPath
			}
		},
		onLoad() {
			this.info = getApplicationDraftInfo()
		},
		methods: {
			money: formatMoney,
			chooseProof() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: ({ tempFilePaths, tempFiles }) => {
						this.form.proofPath = tempFilePaths[0]
						const file = tempFiles && tempFiles[0]
						this.form.proofName = (file && file.name) || '订单截图'
					},
					fail: error => {
						if (!String(error.errMsg || '').includes('cancel')) {
							uni.showToast({ title: '暂时无法读取图片', icon: 'none' })
						}
					}
				})
			},
			confirmSubmit() {
				if (!this.canSubmit || this.submitting) return
				uni.showModal({
					title: '确认提交这笔申请？',
					content: `${this.form.platform}订单实付 ¥${formatMoney(this.orderAmountCents)}，预计申请 ¥${formatMoney(this.estimatedCents)}。请确认订单已经收货。`,
					confirmText: '确认提交',
					cancelText: '再检查一下',
					success: result => {
						if (result.confirm) this.submit()
					}
				})
			},
			submit() {
				this.submitting = true
				try {
					submitApplication({
						platform: this.form.platform,
						orderNo: this.form.orderNo,
						orderAmountCents: this.orderAmountCents,
						hasProof: Boolean(this.form.proofPath),
						proofName: this.form.proofName,
						note: this.form.note
					})
					uni.showToast({ title: '申请已提交', icon: 'success', duration: 1400 })
					setTimeout(() => {
						uni.switchTab({ url: '/pages/applications/index' })
					}, 500)
				} catch (error) {
					uni.showModal({
						title: '暂时不能提交',
						content: error.message || '请检查填写内容后再试',
						showCancel: false,
						confirmText: '知道了'
					})
				} finally {
					this.submitting = false
				}
			}
		}
	}
</script>

<style scoped>
	.form-screen { padding-bottom: calc(60rpx + env(safe-area-inset-bottom)); }
	.step-header { display: flex; align-items: flex-start; margin: 4rpx 12rpx 34rpx; }
	.step { width: 122rpx; display: flex; flex-direction: column; align-items: center; gap: 10rpx; font-size: 24rpx; color: #8A938E; text-align: center; }
	.step-number { width: 54rpx; height: 54rpx; display: flex; align-items: center; justify-content: center; border: 3rpx solid #C9CFCA; border-radius: 50%; background: #F6F1E7; font-size: 23rpx; font-weight: 760; }
	.step.active { color: #176044; font-weight: 700; }
	.step.active .step-number { border-color: #176044; background: #176044; color: #FFFFFF; }
	.step-line { flex: 1; height: 3rpx; margin-top: 26rpx; background: #CDD3CE; }
	.quota-card { display: flex; align-items: flex-end; justify-content: space-between; gap: 24rpx; margin-bottom: 24rpx; padding: 30rpx; border-radius: 28rpx; background: #174F3B; color: #FFFFFF; }
	.quota-label, .quota-value { display: block; }
	.quota-label { font-size: 25rpx; color: rgba(255,255,255,.7); }
	.quota-value { margin-top: 5rpx; font-size: 48rpx; font-weight: 780; }
	.quota-note { max-width: 220rpx; padding-bottom: 8rpx; font-size: 24rpx; line-height: 1.5; color: rgba(255,255,255,.68); text-align: right; }
	.form-card { padding: 34rpx 30rpx; }
	.form-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6rpx; }
	.form-title { font-size: 36rpx; font-weight: 750; color: #203129; }
	.required-note { font-size: 23rpx; color: #7A847E; }
	.required-note text, .required { color: #B44F2E; }
	.field { position: relative; padding: 32rpx 0; border-bottom: 2rpx solid #E8E8E2; }
	.field.last { border-bottom: 0; padding-bottom: 6rpx; }
	.field-label { display: block; margin-bottom: 16rpx; font-size: 29rpx; font-weight: 700; color: #2A3A32; }
	.optional { margin-left: 10rpx; font-size: 23rpx; font-weight: 500; color: #89928D; }
	.channel-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14rpx; }
	.channel-option { min-height: 88rpx; display: flex; align-items: center; gap: 14rpx; padding: 0 18rpx; border: 3rpx solid #E2E5E2; border-radius: 20rpx; background: #FAF9F5; font-size: 27rpx; color: #4B5851; }
	.channel-option.selected { border-color: #277155; background: #E7F1EA; color: #174E3A; font-weight: 700; }
	.radio-dot { width: 32rpx; height: 32rpx; display: flex; align-items: center; justify-content: center; border: 3rpx solid #ABB4AE; border-radius: 50%; }
	.channel-option.selected .radio-dot { border-color: #176044; }
	.radio-dot view { width: 16rpx; height: 16rpx; border-radius: 50%; background: #176044; }
	.field-input, .money-input-wrap, .field-textarea { width: 100%; border: 3rpx solid #DCE1DD; border-radius: 20rpx; background: #FBFAF6; }
	.field-input { height: 96rpx; padding: 0 24rpx; font-size: 30rpx; color: #213129; }
	.field-help { display: block; margin-top: 12rpx; font-size: 24rpx; color: #79837D; }
	.money-input-wrap { height: 104rpx; display: flex; align-items: center; padding: 0 24rpx; }
	.money-prefix { margin-right: 14rpx; font-size: 34rpx; font-weight: 700; color: #304139; }
	.money-input { min-width: 0; flex: 1; height: 100%; font-size: 40rpx; font-weight: 720; color: #17231D; }
	.money-unit { font-size: 27rpx; color: #6C7770; }
	.estimate { display: flex; align-items: center; justify-content: space-between; margin-top: 14rpx; padding: 18rpx 20rpx; border-radius: 16rpx; background: #E8F2EB; font-size: 26rpx; color: #3E594A; }
	.estimate-value { font-size: 30rpx; font-weight: 760; color: #176044; }
	.upload-box { min-height: 220rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28rpx; border: 3rpx dashed #AEBAB2; border-radius: 24rpx; background: #F8F7F2; text-align: center; }
	.upload-plus { width: 62rpx; height: 62rpx; display: flex; align-items: center; justify-content: center; border-radius: 20rpx; background: #DFEDE3; color: #176044; font-size: 42rpx; line-height: 1; }
	.upload-title { margin-top: 14rpx; font-size: 29rpx; font-weight: 700; color: #2D4036; }
	.upload-help { margin-top: 8rpx; font-size: 24rpx; color: #758079; }
	.proof-preview { display: flex; gap: 22rpx; padding: 18rpx; border: 3rpx solid #C9D7CD; border-radius: 22rpx; background: #F6FAF7; }
	.proof-image { width: 156rpx; height: 156rpx; flex-shrink: 0; border-radius: 16rpx; background: #E8EAE7; }
	.proof-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; justify-content: center; }
	.proof-title, .proof-name { display: block; }
	.proof-title { font-size: 28rpx; font-weight: 700; color: #254232; }
	.proof-name { max-width: 330rpx; margin-top: 6rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 23rpx; color: #748078; }
	.replace-proof { min-height: 60rpx; display: flex; align-items: center; margin-top: 8rpx; font-size: 26rpx; font-weight: 680; color: #176044; }
	.field-textarea { height: 190rpx; padding: 22rpx 24rpx; font-size: 28rpx; color: #213129; }
	.counter { position: absolute; right: 16rpx; bottom: 18rpx; padding: 4rpx 10rpx; background: #FBFAF6; font-size: 22rpx; color: #8B948F; }
	.input-placeholder { color: #9BA39E; font-weight: 400; }
	.privacy-note { display: flex; align-items: flex-start; gap: 16rpx; margin: 24rpx 4rpx; padding: 24rpx; border-radius: 22rpx; background: #ECEEE8; font-size: 25rpx; color: #59665F; }
	.privacy-mark { flex: 0 0 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #D7E3D9; color: #265B43; font-size: 22rpx; font-weight: 750; }
	.submit-button { margin-top: 26rpx; }
	.submit-tip { display: block; margin-top: 18rpx; padding: 0 20rpx; text-align: center; font-size: 24rpx; color: #77817B; }
</style>

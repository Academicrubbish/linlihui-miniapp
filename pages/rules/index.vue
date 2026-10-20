<template>
	<view class="screen">
		<view class="rule-hero">
			<view class="rule-seal">惠</view>
			<text class="rule-kicker">邻里惠 · 公开约定</text>
			<text class="rule-title">先把规则讲明白，<br />再开始领福利。</text>
			<text class="rule-lead">这份福利来自店主的真实经营预算，不是投资产品，也不靠发展新会员维持。</text>
		</view>

		<view class="principle-grid">
			<view class="principle-card">
				<text class="principle-number">01</text>
				<text class="principle-title">免费获得</text>
				<text class="principle-copy">顾客不用充值，也不用先花钱购买额度。</text>
			</view>
			<view class="principle-card">
				<text class="principle-number">02</text>
				<text class="principle-title">自己选择</text>
				<text class="principle-copy">活动允许时，可以继续选择原来的实物福利。</text>
			</view>
			<view class="principle-card">
				<text class="principle-number">03</text>
				<text class="principle-title">真实订单</text>
				<text class="principle-copy">确认收货后，按真实实付金额提交申请。</text>
			</view>
			<view class="principle-card">
				<text class="principle-number">04</text>
				<text class="principle-title">笔笔留痕</text>
				<text class="principle-copy">发放、使用、退回和调整都有记录。</text>
			</view>
		</view>

		<view class="section-heading"><text class="section-title">怎么使用</text></view>
		<view class="process-card card">
			<view v-for="(step, index) in steps" :key="step.title" class="process-item">
				<view class="process-index">{{ index + 1 }}</view>
				<view class="process-copy">
					<text class="process-title">{{ step.title }}</text>
					<text class="process-text">{{ step.text }}</text>
				</view>
			</view>
		</view>

		<view class="section-heading"><text class="section-title">这些事情不做</text></view>
		<view class="no-list card">
			<view v-for="item in forbidden" :key="item" class="no-item">
				<view class="no-mark">×</view>
				<text>{{ item }}</text>
			</view>
		</view>

		<view class="notice-card">
			<text class="notice-title">退货或订单取消怎么办？</text>
			<text class="notice-copy">补贴发放前订单发生退货，申请会被退回；补贴已经发放后发生退款，请联系店主核对，系统会用新增调整记录处理，不删除历史。</text>
		</view>

		<view class="version-note">
			<text>规则版本：体验版 1.0</text>
			<text>更新日期：2026年10月20日</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				steps: [
					{ title: '店主发放福利', text: '到店活动或熟客回馈时，店主免费发放购物补贴额度。' },
					{ title: '完成真实购物', text: '通过自己选择的正规渠道购物，并等待订单确认收货。' },
					{ title: '提交补贴申请', text: '填写订单号、实付金额，添加能看清关键信息的截图。' },
					{ title: '店主核对发放', text: '店主核实订单后通过申请，并通过线下约定方式发放补贴。' }
				],
				forbidden: [
					'不能充值、购买、转让或交易福利额度',
					'不承诺利息、升值、分红或固定收益',
					'不设置上下级，不按拉人数量发奖励',
					'不与麻将输赢、筹码或牌局结果挂钩',
					'不要求顾客传播口令或下载陌生应用'
				]
			}
		}
	}
</script>

<style scoped>
	.rule-hero { position: relative; overflow: hidden; padding: 52rpx 38rpx 44rpx; border-radius: 40rpx; background: #163F30; color: #FFFFFF; }
	.rule-hero::after { content: ''; position: absolute; right: -90rpx; top: -100rpx; width: 330rpx; height: 330rpx; border-radius: 50%; border: 70rpx solid rgba(245,211,147,.1); }
	.rule-seal { position: relative; z-index: 1; width: 72rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 38rpx; border-radius: 24rpx 24rpx 8rpx 24rpx; background: #F4CC7D; color: #493218; font-size: 32rpx; font-weight: 780; }
	.rule-kicker, .rule-title, .rule-lead { position: relative; z-index: 1; display: block; }
	.rule-kicker { font-size: 24rpx; font-weight: 700; letter-spacing: 3rpx; color: #F2CE8B; }
	.rule-title { margin-top: 18rpx; font-size: 50rpx; font-weight: 780; line-height: 1.3; letter-spacing: -1rpx; }
	.rule-lead { max-width: 590rpx; margin-top: 26rpx; font-size: 28rpx; line-height: 1.7; color: rgba(255,255,255,.72); }
	.principle-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18rpx; margin-top: 24rpx; }
	.principle-card { min-height: 260rpx; padding: 26rpx; border-radius: 28rpx; background: #FFFDF8; border: 2rpx solid rgba(23,35,29,.07); }
	.principle-number, .principle-title, .principle-copy { display: block; }
	.principle-number { font-size: 23rpx; font-weight: 760; color: #BA622E; letter-spacing: 2rpx; }
	.principle-title { margin-top: 20rpx; font-size: 31rpx; font-weight: 750; color: #22342B; }
	.principle-copy { margin-top: 10rpx; font-size: 25rpx; line-height: 1.6; color: #68736D; }
	.process-card { padding: 10rpx 30rpx; }
	.process-item { display: flex; gap: 22rpx; padding: 28rpx 0; border-bottom: 2rpx solid #ECEBE5; }
	.process-item:last-child { border-bottom: 0; }
	.process-index { flex: 0 0 58rpx; height: 58rpx; display: flex; align-items: center; justify-content: center; border-radius: 19rpx; background: #E1F0E5; color: #176044; font-size: 25rpx; font-weight: 760; }
	.process-copy { min-width: 0; flex: 1; }
	.process-title, .process-text { display: block; }
	.process-title { font-size: 30rpx; font-weight: 720; color: #24352C; }
	.process-text { margin-top: 7rpx; font-size: 26rpx; line-height: 1.6; color: #69746E; }
	.no-list { padding: 10rpx 30rpx; }
	.no-item { display: flex; align-items: flex-start; gap: 18rpx; padding: 24rpx 0; border-bottom: 2rpx solid #ECEBE5; font-size: 27rpx; color: #4E5B54; }
	.no-item:last-child { border-bottom: 0; }
	.no-mark { flex: 0 0 44rpx; height: 44rpx; display: flex; align-items: center; justify-content: center; margin-top: 1rpx; border-radius: 50%; background: #F8E3D9; color: #9F4426; font-size: 28rpx; font-weight: 700; }
	.notice-card { margin-top: 30rpx; padding: 30rpx; border-radius: 28rpx; border-left: 8rpx solid #D98343; background: #FFF0DE; }
	.notice-title, .notice-copy { display: block; }
	.notice-title { font-size: 30rpx; font-weight: 730; color: #663E22; }
	.notice-copy { margin-top: 10rpx; font-size: 26rpx; line-height: 1.7; color: #76583F; }
	.version-note { display: flex; justify-content: space-between; gap: 18rpx; margin-top: 34rpx; padding: 24rpx 8rpx; border-top: 2rpx solid #D8DDD9; font-size: 23rpx; color: #818A85; }
</style>

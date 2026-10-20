<template>
	<view class="screen tab-screen">
		<view class="page-intro">
			<text class="eyebrow">清清楚楚</text>
			<text class="page-title">福利明细</text>
			<text class="page-description">每一次发放和使用都会留下记录，旧记录不会被覆盖。</text>
		</view>

		<view class="summary-card card">
			<view class="summary-main">
				<text class="summary-label">当前可用</text>
				<text class="summary-value">¥{{ money(data.account.availableCents) }}</text>
			</view>
			<view class="summary-side">
				<text class="side-label">账面额度</text>
				<text class="side-value">¥{{ money(data.account.balanceCents) }}</text>
				<text class="side-label second">审核中</text>
				<text class="side-value">¥{{ money(data.account.frozenCents) }}</text>
			</view>
		</view>

		<view class="explain-bar">
			<view class="explain-dot"></view>
			<text>审核中的金额会暂时冻结，避免重复申请。</text>
		</view>

		<view class="section-heading">
			<text class="section-title">全部记录</text>
			<text class="record-count">共 {{ data.items.length }} 笔</text>
		</view>

		<view v-if="data.items.length" class="timeline">
			<view v-for="item in data.items" :key="item.id" class="timeline-item">
				<view class="timeline-marker" :class="{ debit: item.amountCents < 0 }">
					<text>{{ item.amountCents < 0 ? '用' : '惠' }}</text>
				</view>
				<view class="timeline-card card">
					<view class="timeline-top">
						<text class="item-title">{{ item.title }}</text>
						<text class="item-amount" :class="{ debit: item.amountCents < 0 }">
							{{ item.amountCents < 0 ? '−' : '+' }}¥{{ money(Math.abs(item.amountCents)) }}
						</text>
					</view>
					<text class="item-note">{{ item.note }}</text>
					<text class="item-time">{{ date(item.createdAt) }}</text>
				</view>
			</view>
		</view>

		<view v-else class="empty-state card">
			<text class="empty-title">还没有福利记录</text>
			<text class="empty-description">店主发放后，记录会显示在这里。</text>
		</view>

		<view class="ledger-footnote">
			<text class="footnote-title">有疑问怎么办？</text>
			<text class="footnote-copy">直接联系店主，并告诉她记录的日期和金额。不要把验证码告诉任何人。</text>
		</view>
	</view>
</template>

<script>
	import { getLedgers } from '@/services/benefit-service.js'
	import { formatMoney, formatDate } from '@/utils/format.js'

	export default {
		data() {
			return {
				data: {
					account: { availableCents: 0, balanceCents: 0, frozenCents: 0 },
					items: []
				}
			}
		},
		onShow() {
			this.data = getLedgers()
		},
		methods: {
			money: formatMoney,
			date(value) { return formatDate(value, true) }
		}
	}
</script>

<style scoped>
	.tab-screen { padding-bottom: calc(150rpx + env(safe-area-inset-bottom)); }
	.summary-card { display: flex; align-items: stretch; overflow: hidden; background: #174F3B; color: #FFFFFF; }
	.summary-main { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 38rpx 34rpx; }
	.summary-label { font-size: 27rpx; color: rgba(255,255,255,.72); }
	.summary-value { margin-top: 8rpx; font-size: 64rpx; line-height: 1.2; font-weight: 780; letter-spacing: -2rpx; }
	.summary-side { flex: 0 0 230rpx; padding: 32rpx 30rpx; background: rgba(255,255,255,.08); }
	.side-label, .side-value { display: block; }
	.side-label { font-size: 23rpx; color: rgba(255,255,255,.64); }
	.side-label.second { margin-top: 16rpx; }
	.side-value { font-size: 28rpx; font-weight: 700; color: #FFFFFF; }
	.explain-bar { display: flex; align-items: center; gap: 14rpx; margin-top: 20rpx; padding: 20rpx 24rpx; border-radius: 20rpx; background: #FFF0D8; font-size: 25rpx; color: #765029; }
	.explain-dot { flex: 0 0 12rpx; height: 12rpx; border-radius: 50%; background: #D67A37; }
	.record-count { font-size: 26rpx; color: #737F77; }
	.timeline { position: relative; }
	.timeline::before { content: ''; position: absolute; left: 35rpx; top: 46rpx; bottom: 46rpx; width: 2rpx; background: #CBD7CF; }
	.timeline-item { position: relative; display: flex; align-items: flex-start; gap: 20rpx; margin-bottom: 20rpx; }
	.timeline-marker { position: relative; z-index: 1; flex: 0 0 70rpx; height: 70rpx; display: flex; align-items: center; justify-content: center; margin-top: 28rpx; border: 8rpx solid #F6F1E7; border-radius: 50%; background: #DDEEE2; color: #176044; font-size: 23rpx; font-weight: 780; }
	.timeline-marker.debit { background: #F9E4D8; color: #994622; }
	.timeline-card { min-width: 0; flex: 1; padding: 28rpx; }
	.timeline-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20rpx; }
	.item-title { min-width: 0; flex: 1; font-size: 30rpx; font-weight: 720; color: #223129; }
	.item-amount { flex-shrink: 0; font-size: 31rpx; font-weight: 760; color: #176044; }
	.item-amount.debit { color: #9B4526; }
	.item-note, .item-time { display: block; }
	.item-note { margin-top: 12rpx; font-size: 27rpx; color: #5E6A63; }
	.item-time { margin-top: 14rpx; font-size: 23rpx; color: #8A938E; }
	.ledger-footnote { margin-top: 34rpx; padding: 30rpx; border-top: 2rpx solid #D9DED9; }
	.footnote-title, .footnote-copy { display: block; }
	.footnote-title { font-size: 28rpx; font-weight: 720; color: #304139; }
	.footnote-copy { margin-top: 10rpx; font-size: 26rpx; color: #657169; }
</style>

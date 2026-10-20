<script>
	export default {
		onLaunch: function() {
			console.log('邻里惠启动')
		},
		onShow: function() {},
		onHide: function() {}
	}
</script>

<style>
	page {
		min-height: 100%;
		background: #F6F1E7;
		color: #17231D;
		font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
		font-size: 32rpx;
		line-height: 1.55;
	}

	view,
	text,
	button,
	input,
	textarea,
	picker {
		box-sizing: border-box;
	}

	button::after {
		border: 0;
	}

	.screen {
		width: 100%;
		max-width: 960rpx;
		margin: 0 auto;
		padding: 32rpx 28rpx calc(48rpx + env(safe-area-inset-bottom));
	}

	.page-intro {
		margin: 14rpx 4rpx 30rpx;
	}

	.page-title {
		display: block;
		font-size: 48rpx;
		font-weight: 760;
		line-height: 1.2;
		letter-spacing: -1rpx;
		color: #17231D;
	}

	.page-description {
		display: block;
		margin-top: 12rpx;
		font-size: 30rpx;
		line-height: 1.65;
		color: #56635C;
	}

	.eyebrow {
		display: block;
		margin-bottom: 12rpx;
		font-size: 24rpx;
		font-weight: 700;
		line-height: 1.4;
		letter-spacing: 3rpx;
		color: #A84F1D;
	}

	.card {
		background: #FFFDF8;
		border: 2rpx solid rgba(23, 35, 29, 0.08);
		border-radius: 32rpx;
		box-shadow: 0 18rpx 48rpx rgba(49, 62, 53, 0.07);
	}

	.section-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20rpx;
		margin: 44rpx 4rpx 22rpx;
	}

	.section-title {
		font-size: 36rpx;
		font-weight: 730;
		line-height: 1.3;
		color: #17231D;
	}

	.text-link {
		min-height: 72rpx;
		display: inline-flex;
		align-items: center;
		padding: 0 8rpx;
		font-size: 28rpx;
		font-weight: 650;
		color: #176044;
	}

	.primary-button,
	.secondary-button,
	.danger-button {
		width: 100%;
		min-height: 104rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 26rpx;
		font-size: 34rpx;
		font-weight: 720;
		line-height: 1.2;
		letter-spacing: 1rpx;
	}

	.primary-button {
		background: #176044;
		color: #FFFFFF;
		box-shadow: 0 16rpx 32rpx rgba(23, 96, 68, 0.2);
	}

	.primary-button[disabled] {
		background: #A7B4AD;
		color: #F4F6F5;
		box-shadow: none;
	}

	.secondary-button {
		background: #E5F0E8;
		color: #174C38;
	}

	.danger-button {
		background: #FBE7DE;
		color: #8C371B;
	}

	.demo-badge {
		display: inline-flex;
		align-items: center;
		min-height: 48rpx;
		padding: 0 18rpx;
		border-radius: 999rpx;
		background: #FFF0D8;
		font-size: 24rpx;
		font-weight: 700;
		color: #8A4B16;
	}

	.status-pill {
		display: inline-flex;
		align-items: center;
		min-height: 52rpx;
		padding: 0 18rpx;
		border-radius: 999rpx;
		font-size: 25rpx;
		font-weight: 700;
	}

	.status-warning {
		background: #FFF0D8;
		color: #8A4B16;
	}

	.status-success {
		background: #DCEFE3;
		color: #17583F;
	}

	.status-danger {
		background: #FBE7DE;
		color: #8C371B;
	}

	.empty-state {
		padding: 72rpx 40rpx;
		text-align: center;
	}

	.empty-title {
		display: block;
		font-size: 34rpx;
		font-weight: 720;
		color: #27372F;
	}

	.empty-description {
		display: block;
		margin-top: 12rpx;
		font-size: 28rpx;
		color: #657169;
	}
</style>

<script>
export default {
  onHide() {
    // #ifdef MP-WEIXIN
    const fs = wx.getFileSystemManager()
    for (const extension of ['png', 'jpg']) fs.unlink({ filePath: `${wx.env.USER_DATA_PATH}/haolin-proof.${extension}`, fail() {} })
    // #endif
  }
}
</script>
<style>
page { background: #FAF8F4; color: #292E2B; font: 36rpx/1.6 -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; }
view, text, button, input, textarea { box-sizing: border-box; }
button { margin: 0; font-family: inherit; }
button::after { border: 0; }
.screen { max-width: 880rpx; margin: auto; padding: 28rpx 28rpx calc(48rpx + env(safe-area-inset-bottom)); }
.card { background: #FFF; border: 2rpx solid #E8E5DD; border-radius: 28rpx; padding: 30rpx; margin-bottom: 24rpx; }
.title { display: block; font-size: 40rpx; font-weight: 700; line-height: 1.4; }
.muted { color: #606960; font-size: 16px; }
.block { display: block; }
.row { display: flex; justify-content: space-between; align-items: center; gap: 20rpx; }
.grow { flex: 1; min-width: 0; }
.wrap { overflow-wrap: anywhere; word-break: break-all; }
.field { display: block; margin: 28rpx 0 12rpx; font-size: 18px; font-weight: 600; }
input, textarea { width: 100%; border: 2rpx solid #B9C1B6; border-radius: 16rpx; background: #FFF; color: #292E2B; padding: 18rpx 22rpx; font-size: 18px; }
input { min-height: 100rpx; height: 100rpx; }
textarea { min-height: 150rpx; }
.primary, .secondary, .danger { width: 100%; min-height: 104rpx; border-radius: 18rpx; padding: 20rpx 22rpx; font-size: 19px; font-weight: 650; line-height: 1.6; }
.primary { background: #315A3F; color: #FFF; }
.secondary { background: #EDF2E9; color: #315A3F; }
.danger { background: #FFF0E9; color: #934526; }
button[disabled] { background: #E3E6DF !important; color: #72796F !important; }
.link { background: transparent; color: #315A3F; font-size: 32rpx; min-height: 88rpx; padding: 12rpx 8rpx; line-height: 2; flex-shrink: 0; }
.stack > button { margin-top: 18rpx; }
.error { margin: 20rpx 0; padding: 22rpx; background: #FFF0E9; color: #8C3E22; border-radius: 16rpx; font-size: 32rpx; overflow-wrap: anywhere; }
.notice { background: #EFF4EA; color: #315A3F; padding: 22rpx; border-radius: 16rpx; margin: 20rpx 0; font-size: 32rpx; }
.divider { border-top: 2rpx solid #EEECE5; margin: 26rpx 0; }
.overlay { position: fixed; inset: 0; z-index: 99; background: rgba(22,32,23,.45); display: flex; align-items: center; justify-content: center; padding: 28rpx; }
.dialog { width: 100%; max-width: 760rpx; max-height: 85vh; overflow-y: auto; border-radius: 28rpx; background: white; padding: 32rpx; }
.amount { font-variant-numeric: tabular-nums; }
</style>

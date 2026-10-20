export function formatMoney(cents) {
	const value = Number(cents || 0) / 100
	return value.toLocaleString('zh-CN', {
		minimumFractionDigits: value % 1 === 0 ? 0 : 2,
		maximumFractionDigits: 2
	})
}

export function formatDate(value, includeTime = false) {
	if (!value) return '—'
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return '—'
	const parts = [
		date.getFullYear(),
		String(date.getMonth() + 1).padStart(2, '0'),
		String(date.getDate()).padStart(2, '0')
	]
	const base = `${parts[0]}年${parts[1]}月${parts[2]}日`
	if (!includeTime) return base
	return `${base} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export const applicationStatus = {
	pending: { label: '待店主审核', tone: 'warning', hint: '店主核对订单后会更新结果' },
	approved: { label: '已通过，待发放', tone: 'success', hint: '额度已扣除，店主将线下发放补贴' },
	paid: { label: '补贴已发放', tone: 'success', hint: '如未收到，请直接联系店主' },
	rejected: { label: '已退回', tone: 'danger', hint: '请查看原因，修改后可重新提交' }
}

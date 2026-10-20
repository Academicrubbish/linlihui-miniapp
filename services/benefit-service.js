const STORAGE_KEY = 'linlihui_demo_state_v2'
const DEMO_CUSTOMER_ID = 'customer_demo_001'

const seedState = {
	schemaVersion: 2,
	mode: 'demo',
	activeCustomerId: DEMO_CUSTOMER_ID,
	activity: {
		name: '一周体验活动',
		summary: '到店可选一桶桶面，或 10 元购物补贴额度',
		validUntil: '2026-10-27',
		benefitCents: 1000
	},
	customers: [
		{
			id: DEMO_CUSTOMER_ID,
			name: '王阿姨',
			mobile: '138****5678',
			joinedAt: '2026-10-18T09:20:00+08:00'
		},
		{
			id: 'customer_demo_002',
			name: '李叔叔',
			mobile: '139****2036',
			joinedAt: '2026-10-19T14:10:00+08:00'
		}
	],
	ledgers: [
		{
			id: 'ledger_demo_001',
			customerId: DEMO_CUSTOMER_ID,
			type: 'grant',
			amountCents: 5000,
			title: '首位体验奖励',
			note: '徙木立信活动',
			createdAt: '2026-10-18T09:30:00+08:00'
		},
		{
			id: 'ledger_demo_002',
			customerId: DEMO_CUSTOMER_ID,
			type: 'grant',
			amountCents: 1000,
			title: '到店福利',
			note: '选择购物补贴额度',
			createdAt: '2026-10-19T15:10:00+08:00'
		},
		{
			id: 'ledger_demo_003',
			customerId: DEMO_CUSTOMER_ID,
			type: 'grant',
			amountCents: 500,
			title: '到店福利',
			note: '日常熟客福利',
			createdAt: '2026-10-20T10:05:00+08:00'
		},
		{
			id: 'ledger_demo_004',
			customerId: 'customer_demo_002',
			type: 'grant',
			amountCents: 1000,
			title: '到店福利',
			note: '一周体验活动',
			createdAt: '2026-10-20T11:05:00+08:00'
		}
	],
	applications: [
		{
			id: 'application_demo_001',
			customerId: DEMO_CUSTOMER_ID,
			platform: '兴盛优选',
			orderNo: 'XS202610190018',
			orderAmountCents: 1000,
			requestedCents: 1000,
			status: 'pending',
			hasProof: true,
			note: '日用品订单，已确认收货',
			createdAt: '2026-10-19T16:20:00+08:00',
			updatedAt: '2026-10-19T16:20:00+08:00'
		}
	]
}

function clone(value) {
	return JSON.parse(JSON.stringify(value))
}

function loadState() {
	try {
		const saved = uni.getStorageSync(STORAGE_KEY)
		if (saved && saved.schemaVersion === seedState.schemaVersion) {
			return saved
		}
	} catch (error) {
		console.warn('读取演示数据失败，将使用初始数据', error)
	}
	return clone(seedState)
}

function saveState(state) {
	uni.setStorageSync(STORAGE_KEY, state)
	return state
}

function createId(prefix) {
	return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function now() {
	return new Date().toISOString()
}

function requirePositiveCents(value, fieldName) {
	if (!Number.isInteger(value) || value <= 0) {
		throw new Error(`${fieldName}必须是大于 0 的整数金额`)
	}
}

function getCustomer(state, customerId) {
	const customer = state.customers.find(item => item.id === customerId)
	if (!customer) {
		throw new Error('没有找到这位顾客')
	}
	return customer
}

function getAccountSummary(state, customerId) {
	const balanceCents = state.ledgers
		.filter(item => item.customerId === customerId)
		.reduce((sum, item) => sum + item.amountCents, 0)
	const frozenCents = state.applications
		.filter(item => item.customerId === customerId && item.status === 'pending')
		.reduce((sum, item) => sum + item.requestedCents, 0)

	return {
		balanceCents,
		frozenCents,
		availableCents: Math.max(0, balanceCents - frozenCents)
	}
}

export function getDashboard() {
	const state = loadState()
	const customer = getCustomer(state, state.activeCustomerId)
	return clone({
		mode: state.mode,
		customer,
		activity: state.activity,
		account: getAccountSummary(state, customer.id),
		recentLedgers: state.ledgers
			.filter(item => item.customerId === customer.id)
			.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
			.slice(0, 3),
		pendingCount: state.applications.filter(item => item.customerId === customer.id && item.status === 'pending').length
	})
}

export function getLedgers() {
	const state = loadState()
	return clone({
		account: getAccountSummary(state, state.activeCustomerId),
		items: state.ledgers
			.filter(item => item.customerId === state.activeCustomerId)
			.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
	})
}

export function getApplications() {
	const state = loadState()
	return clone(state.applications
		.filter(item => item.customerId === state.activeCustomerId)
		.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
}

export function getApplicationDraftInfo() {
	const state = loadState()
	return clone({
		customer: getCustomer(state, state.activeCustomerId),
		account: getAccountSummary(state, state.activeCustomerId)
	})
}

export function submitApplication(payload) {
	const state = loadState()
	const customerId = state.activeCustomerId
	const account = getAccountSummary(state, customerId)
	const platform = String(payload.platform || '').trim()
	const orderNo = String(payload.orderNo || '').trim()
	const note = String(payload.note || '').trim().slice(0, 120)

	if (!platform) throw new Error('请选择购物渠道')
	if (orderNo.length < 6) throw new Error('请填写不少于 6 位的订单号')
	requirePositiveCents(payload.orderAmountCents, '实付金额')
	if (!payload.hasProof) throw new Error('请添加订单凭证，方便店主核对')
	if (account.availableCents <= 0) throw new Error('当前没有可申请的福利额度')

	const duplicate = state.applications.find(item => item.orderNo === orderNo && item.status !== 'rejected')
	if (duplicate) throw new Error('这个订单已经提交过，请不要重复申请')

	const requestedCents = Math.min(payload.orderAmountCents, account.availableCents)
	const timestamp = now()
	const application = {
		id: createId('application'),
		customerId,
		platform,
		orderNo,
		orderAmountCents: payload.orderAmountCents,
		requestedCents,
		status: 'pending',
		hasProof: true,
		proofName: String(payload.proofName || '订单凭证'),
		note,
		createdAt: timestamp,
		updatedAt: timestamp
	}
	state.applications.unshift(application)
	saveState(state)
	return clone(application)
}

export function getAdminDashboard() {
	const state = loadState()
	const customers = state.customers.map(customer => ({
		...customer,
		account: getAccountSummary(state, customer.id)
	}))
	const pendingApplications = state.applications.filter(item => item.status === 'pending')
	return clone({
		mode: state.mode,
		customers,
		pendingCount: pendingApplications.length,
		pendingCents: pendingApplications.reduce((sum, item) => sum + item.requestedCents, 0),
		todayGrantCents: state.ledgers
			.filter(item => item.type === 'grant' && item.createdAt.slice(0, 10) === now().slice(0, 10))
			.reduce((sum, item) => sum + item.amountCents, 0)
	})
}

export function getCustomers() {
	const state = loadState()
	return clone(state.customers.map(customer => ({
		...customer,
		account: getAccountSummary(state, customer.id)
	})))
}

export function grantBenefit(payload) {
	const state = loadState()
	const customer = getCustomer(state, payload.customerId)
	requirePositiveCents(payload.amountCents, '发放金额')
	if (payload.amountCents > 50000) throw new Error('单次发放不能超过 500 元')
	const reason = String(payload.reason || '').trim()
	if (reason.length < 2) throw new Error('请填写清楚发放原因')

	const ledger = {
		id: createId('ledger'),
		customerId: customer.id,
		type: 'grant',
		amountCents: payload.amountCents,
		title: '店主发放福利',
		note: reason.slice(0, 80),
		createdAt: now()
	}
	state.ledgers.unshift(ledger)
	saveState(state)
	return clone({ customer, ledger })
}

export function getPendingApplications() {
	const state = loadState()
	return clone(state.applications
		.filter(item => item.status === 'pending' || item.status === 'approved')
		.map(item => ({
			...item,
			customer: getCustomer(state, item.customerId)
		}))
		.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)))
}

export function reviewApplication(applicationId, action, reason = '') {
	const state = loadState()
	const application = state.applications.find(item => item.id === applicationId)
	if (!application) throw new Error('没有找到这条申请')
	if (application.status !== 'pending') throw new Error('这条申请已经处理，请刷新页面')
	if (!['approve', 'reject'].includes(action)) throw new Error('不支持的审核操作')

	if (action === 'reject') {
		const reviewReason = String(reason || '').trim()
		if (reviewReason.length < 2) throw new Error('请填写退回原因')
		application.status = 'rejected'
		application.reviewNote = reviewReason.slice(0, 100)
		application.updatedAt = now()
		saveState(state)
		return clone(application)
	}

	const account = getAccountSummary(state, application.customerId)
	if (account.balanceCents < application.requestedCents) throw new Error('顾客账面额度不足，暂时不能通过')
	const alreadyRecorded = state.ledgers.some(item => item.applicationId === application.id)
	if (alreadyRecorded) throw new Error('这条申请已经记账，请刷新页面')

	application.status = 'approved'
	application.reviewNote = String(reason || '订单信息核对无误').trim().slice(0, 100)
	application.updatedAt = now()
	state.ledgers.unshift({
		id: createId('ledger'),
		customerId: application.customerId,
		applicationId: application.id,
		type: 'subsidy_use',
		amountCents: -application.requestedCents,
		title: '购物补贴已核准',
		note: `${application.platform} · 订单尾号 ${application.orderNo.slice(-4)}`,
		createdAt: application.updatedAt
	})
	saveState(state)
	return clone(application)
}

export function markApplicationPaid(applicationId) {
	const state = loadState()
	const application = state.applications.find(item => item.id === applicationId)
	if (!application) throw new Error('没有找到这条申请')
	if (application.status !== 'approved') throw new Error('只有已通过的申请才能标记为已发放')
	application.status = 'paid'
	application.paidAt = now()
	application.updatedAt = application.paidAt
	saveState(state)
	return clone(application)
}

export function resetDemoData() {
	saveState(clone(seedState))
	return getDashboard()
}

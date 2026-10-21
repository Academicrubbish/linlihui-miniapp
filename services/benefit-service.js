const SESSION_KEY = 'haolin_session_v1'
let loginPromise
async function invoke(action, payload, token) {
  let response
  try { response = await uniCloud.callFunction({ name: 'haolin-api', data: { action, payload, token } }) }
  catch (_) { throw new Error('暂时连接不上，请检查网络后重试') }
  const result = response.result
  if (!result || !result.ok) {
    const error = new Error(result?.message || '服务暂时不可用，请稍后再试')
    error.code = result?.code
    throw error
  }
  return result.data
}
async function login() {
  // #ifdef MP-WEIXIN
  const { code } = await uni.login({ provider: 'weixin' })
  const result = await invoke('login', { code })
  uni.setStorageSync(SESSION_KEY, result.token)
  return result.token
  // #endif
  // #ifndef MP-WEIXIN
  throw new Error('请在微信小程序中打开，才能查看您的积分')
  // #endif
}
export async function api(action, payload = {}) {
  let token = uni.getStorageSync(SESSION_KEY)
  if (!token) {
    if (!loginPromise) loginPromise = login().finally(() => { loginPromise = null })
    token = await loginPromise
  }
  try { return await invoke(action, payload, token) }
  catch (error) {
    if (error.code === 'AUTH') uni.removeStorageSync(SESSION_KEY)
    throw error
  }
}
export function requestId() { return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}` }
export function toCents(value) {
  const text = String(value).trim()
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(text)) throw new Error('请填写金额，最多两位小数')
  const [whole, fraction = ''] = text.split('.')
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(result) || result <= 0) throw new Error('金额必须大于 0')
  return result
}
export async function chooseProof() {
  const selection = await uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album'] })
  let path = selection.tempFilePaths[0]
  // #ifdef MP-WEIXIN
  const fs = wx.getFileSystemManager()
  const read = file => new Promise((resolve, reject) => fs.readFile({ filePath: file, encoding: 'base64', success: r => resolve(r.data), fail: reject }))
  let base64 = await read(path)
  if (base64.length > 819200) {
    const compressed = await uni.compressImage({ src: path, quality: 70, compressedWidth: 1440 })
    path = compressed.tempFilePath
    base64 = await read(path)
  }
  if (base64.length > 819200) throw new Error('截图太大，请先裁掉无关区域再选择')
  return { path, base64 }
  // #endif
  // #ifndef MP-WEIXIN
  throw new Error('请在微信中选择收货截图')
  // #endif
}
export async function previewProof(id) {
  const data = await api('proof', { id })
  // #ifdef MP-WEIXIN
  const filePath = `${wx.env.USER_DATA_PATH}/haolin-proof.${data.mime === 'image/png' ? 'png' : 'jpg'}`
  await new Promise((resolve, reject) => wx.getFileSystemManager().writeFile({ filePath, data: data.base64, encoding: 'base64', success: resolve, fail: reject }))
  uni.previewImage({ urls: [filePath] })
  // #endif
  // #ifndef MP-WEIXIN
  uni.previewImage({ urls: [`data:${data.mime};base64,${data.base64}`] })
  // #endif
}

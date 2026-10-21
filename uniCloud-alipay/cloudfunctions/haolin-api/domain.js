'use strict'
const crypto = require('crypto')
const MAX_CENTS = 100000000
function fail(message, code = 'INVALID') {
  const error = new Error(message)
  error.code = code
  throw error
}
function cents(value) {
  if (!Number.isSafeInteger(value) || value <= 0 || value > MAX_CENTS) fail('请输入大于 0、最多两位小数的金额')
  return value
}
function available(customer) {
  const { balance, reserved } = customer
  if (!Number.isSafeInteger(balance) || !Number.isSafeInteger(reserved) || reserved < 0 || balance < reserved || balance > MAX_CENTS) fail('账户需要核查，请联系店主')
  return balance - reserved
}
function settlement(customer, amount) {
  return Math.min(cents(amount), available(customer))
}
const hash = value => crypto.createHash('sha256').update(value).digest('hex')
const random = () => crypto.randomBytes(32).toString('hex')
function text(value, max, label) {
  const result = typeof value === 'string' ? value.trim() : ''
  if (!result || result.length > max) fail(`请填写${label}（最多 ${max} 字）`)
  return result
}
function orderNumber(value) {
  const number = text(value, 64, '订单号').toUpperCase()
  if (!/^[A-Z0-9_-]{6,64}$/.test(number)) fail('请填写完整订单号（至少 6 位字母或数字）')
  return number
}
function proof(value) {
  if (typeof value !== 'string' || value.length > 820000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) fail('截图过大，请裁掉无关区域后重试')
  const bytes = Buffer.from(value, 'base64')
  if (bytes.length > 600 * 1024 || bytes.length < 100) fail('请选择有效的订单截图（不超过 600 KB）')
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  if (!jpeg && !png) fail('截图只支持 JPG 或 PNG')
  return { base64: value, mime: jpeg ? 'image/jpeg' : 'image/png' }
}
function publicCustomer(c) {
  return { id: c._id, memberNo: c._id.slice(0, 10).toUpperCase(), name: c.name, balance: c.balance, reserved: c.reserved }
}
module.exports = { MAX_CENTS, fail, cents, available, settlement, hash, random, text, orderNumber, proof, publicCustomer }

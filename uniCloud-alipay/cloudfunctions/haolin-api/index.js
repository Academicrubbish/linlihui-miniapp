'use strict'
const { createService } = require('./service')
const { fail } = require('./domain')
exports.main = async event => {
  try {
    const execute = createService(uniCloud.database(), async code => {
      const appid = process.env.WEIXIN_APPID
      const secret = process.env.WEIXIN_APPSECRET
      if (appid !== 'wxb2121357f142672b' || !secret) fail('服务尚未配置完成，请联系店主', 'SETUP')
      const result = await uniCloud.httpclient.request('https://api.weixin.qq.com/sns/jscode2session', {
        method: 'GET', data: { appid, secret, js_code: code, grant_type: 'authorization_code' }, dataType: 'json', timeout: 8000
      })
      if (!result.data || result.data.errcode || !result.data.openid) fail('微信登录失败，请重新打开小程序', 'AUTH')
      return result.data.openid
    })
    return { ok: true, data: await execute(event) }
  } catch (error) {
    const known = ['INVALID', 'AUTH', 'ADMIN_AUTH', 'SETUP'].includes(error.code)
    // Do not log tokens, passwords, screenshots, or the code2session response.
    if (!known) console.error('haolin-api operation failed', error.code || error.name)
    return { ok: false, code: known ? error.code : 'RETRY', message: known ? error.message : '操作未确认，请刷新后重试；已转账的请勿再次转账' }
  }
}

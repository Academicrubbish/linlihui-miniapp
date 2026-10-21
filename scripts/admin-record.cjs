#!/usr/bin/env node
// Local helper only. Never uploads to or edits the database.
const readline = require('node:readline')
const { hash } = require('../uniCloud-alipay/cloudfunctions/haolin-api/domain')
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = question => new Promise(resolve => rl.question(question, resolve))
async function main() {
  const openid = (await ask('从 hl-customers 复制 openID：')).trim()
  const name = (await ask('管理员备注（如：妈妈）：')).trim()
  rl.close()
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(openid) || !name || name.length > 20) throw new Error('请检查 openID 和备注')
  process.stdout.write('将以下记录手动加入 hl-admins；不要提交到 Git：\n')
  process.stdout.write(JSON.stringify({ _id: hash(openid), openid, name, enabled: true }, null, 2) + '\n')
}
main().catch(error => { console.error(error.message); process.exitCode = 1 }).finally(() => { process.stdin.pause() })

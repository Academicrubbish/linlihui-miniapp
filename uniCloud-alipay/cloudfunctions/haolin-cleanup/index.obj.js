// Only the built-in scheduled lifecycle is exposed; no client-callable cleanup method.
module.exports = {
  async _timing() {
    const db = uniCloud.database()
    const cmd = db.command
    const now = Date.now()
    const rows = await db.collection('hl-orders').where(cmd.and([
      { proofExpiresAt: cmd.gt(0) }, { proofExpiresAt: cmd.lt(now) }
    ])).limit(200).get()
    for (const row of rows.data) {
      const tx = await db.startTransaction()
      try {
        const result = await tx.collection('hl-orders').doc(row._id).get()
        const order = Array.isArray(result.data) ? result.data[0] : result.data
        // Recheck inside the transaction: a rejected order may have been resubmitted.
        if (order && ['paid', 'rejected'].includes(order.status) && order.proofExpiresAt > 0 && order.proofExpiresAt < now) {
          await tx.collection('hl-proofs').doc(row._id).remove()
          await tx.collection('hl-orders').doc(row._id).update({ proofExpiresAt: 0, proofDeletedAt: now })
        }
        await tx.commit()
      } catch (error) {
        try { await tx.rollback() } catch (_) {}
        throw error
      }
    }
    await db.collection('hl-sessions').where({ expiresAt: cmd.lt(now) }).remove()
    return { checked: rows.data.length }
  }
}

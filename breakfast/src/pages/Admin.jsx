import React, { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore'
import { db } from '../services/firebase.js'
import { useTranslation } from 'react-i18next'

export default function Admin() {
  const [orders, setOrders] = useState([])
  const { t } = useTranslation()

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setOrders(list)
      if (list.some(o => o.status === 'new' && !o.seen)) {
        // Simple beep
        const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=')
        audio.play().catch(()=>{})
      }
    })
    return () => unsub()
  }, [])

  const nextStatus = (s) => s === 'new' ? 'inProgress' : s === 'inProgress' ? 'done' : 'done'

  const advance = async (id, s) => {
    await updateDoc(doc(db, 'orders', id), { status: nextStatus(s) })
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="text-xl font-bold mb-4">{t('adminPanel')}</div>
      <div className="grid md:grid-cols-3 gap-4">
        {orders.map(o => (
          <div key={o.id} className="bg-white border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">#{o.id.slice(-6)}</div>
              <div className={`text-xs px-2 py-1 rounded border ${o.paid?'border-green-500':'border-gray-400'}`}>{o.paid ? t('paid') : t('unpaid')}</div>
            </div>
            <div className="space-y-1">
              {o.items?.map((i, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div>{i.name} × {i.qty}</div>
                  <div>$ {i.price * i.qty}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="font-semibold">{t('total')}: $ {o.total}</div>
              <button onClick={()=>advance(o.id, o.status)} className="px-3 py-1 border rounded">
                {o.status === 'new' ? t('inProgress') : o.status === 'inProgress' ? t('done') : t('done')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

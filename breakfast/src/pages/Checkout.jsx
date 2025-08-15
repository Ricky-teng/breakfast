import React, { useState } from 'react'
import useCart from '../hooks/useCart.js'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, createCheckoutSession } from '../services/firebase.js'
import { useTranslation } from 'react-i18next'

export default function Checkout() {
  const cart = useCart()
  const [type, setType] = useState('takeaway')
  const [pickupTime, setPickupTime] = useState('ASAP')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const { t } = useTranslation()

  const handlePlaceOrder = async () => {
    if (cart.items.length === 0) return
    setLoading(true)
    try {
      // Create an unpaid order record
      const orderRef = await addDoc(collection(db, 'orders'), {
        items: cart.items,
        total: cart.total,
        type,
        pickupTime,
        status: 'new', // new -> inProgress -> done
        paid: false,
        createdAt: serverTimestamp()
      })

      // Create Stripe Checkout session via Firebase Functions
      const res = await createCheckoutSession({
        orderId: orderRef.id,
        total: cart.total,
        currency: 'twd',
        // For demo, send line items directly (production: price IDs)
        items: cart.items.map(i => ({
          name: i.name,
          amount: Math.round(i.price * 100),
          quantity: i.qty
        }))
      })

      const { url } = res.data
      window.location.href = url
    } catch (e) {
      console.error(e)
      alert('Payment init failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <div className="text-xl font-bold">{t('checkout')}</div>

      <div className="bg-white border rounded p-3 space-y-2">
        <div className="flex gap-3">
          <label className="flex items-center gap-2">
            <input type="radio" name="type" checked={type==='takeaway'} onChange={()=>setType('takeaway')} />
            {t('takeaway')}
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" checked={type==='dinein'} onChange={()=>setType('dinein')} />
            {t('dinein')}
          </label>
        </div>
        <div>
          <label className="block text-sm text-gray-500">{t('pickupTime')}</label>
          <input className="w-full border rounded px-3 py-2" value={pickupTime} onChange={e=>setPickupTime(e.target.value)} placeholder="ASAP / 08:30" />
        </div>
      </div>

      <button
        disabled={loading || cart.items.length===0}
        onClick={handlePlaceOrder}
        className="w-full px-4 py-3 bg-black text-white rounded"
      >
        {loading ? '...' : t('payNow')}
      </button>
    </div>
  )
}

import React from 'react'
import useCart from '../hooks/useCart.js'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Cart() {
  const { items, inc, dec, remove, total } = useCart()
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t('cart')}</h1>
      {items.length === 0 ? (
        <div>🧺 Empty</div>
      ) : (
        <div className="space-y-3">
          {items.map(i => (
            <div key={i.id} className="flex items-center justify-between bg-white border rounded p-3">
              <div className="flex-1">
                <div className="font-medium">{i.name}</div>
                <div className="text-sm text-gray-500">$ {i.price}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-2 border rounded" onClick={() => dec(i.id)}>-</button>
                <div>{i.qty}</div>
                <button className="px-2 border rounded" onClick={() => inc(i.id)}>+</button>
              </div>
              <button className="ml-3 text-sm underline" onClick={() => remove(i.id)}>remove</button>
            </div>
          ))}
          <div className="flex items-center justify-between font-semibold">
            <div>{t('total')}</div><div>$ {total}</div>
          </div>
          <Link to="/checkout" className="inline-block px-4 py-2 bg-black text-white rounded">{t('checkout')}</Link>
        </div>
      )}
    </div>
  )
}

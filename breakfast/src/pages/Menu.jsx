import React from 'react'
import { MENU } from '../data/menu.js'
import useCart from '../hooks/useCart.js'
import { useTranslation } from 'react-i18next'

export default function Menu() {
  const cart = useCart()
  const { i18n, t } = useTranslation()

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t('menu')}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {MENU.map(item => (
          <div key={item.id} className="bg-white border rounded p-3 flex flex-col">
            <div className="font-semibold">
              {i18n.language.startsWith('zh') ? item.name_zh : item.name_en}
            </div>
            <div className="text-sm text-gray-500 mt-1">$ {item.price}</div>
            <button
              onClick={() => cart.add({ id: item.id, name: i18n.language.startsWith('zh') ? item.name_zh : item.name_en, price: item.price })}
              className="mt-auto px-3 py-2 bg-black text-white rounded"
            >
              {t('addToCart')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

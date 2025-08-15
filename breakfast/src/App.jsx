import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Menu from './pages/Menu.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderSuccess from './pages/OrderSuccess.jsx'
import Admin from './pages/Admin.jsx'
import { useTranslation } from 'react-i18next'

export default function App() {
  const { t, i18n } = useTranslation()

  const switchLang = () => {
    const next = i18n.language.startsWith('zh') ? 'en' : 'zh-TW'
    i18n.changeLanguage(next)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg">{t('siteTitle')}</Link>
          <nav className="flex items-center gap-3">
            <Link to="/cart" className="underline">{t('cart')}</Link>
            <button onClick={switchLang} className="px-3 py-1 border rounded">
              {i18n.language.startsWith('zh') ? 'EN' : '中'}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/success" element={<OrderSuccess />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      <footer className="border-t bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 text-sm text-gray-500">
          © 早餐店 · Online Ordering
        </div>
      </footer>
    </div>
  )
}

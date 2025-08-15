import { useState } from 'react'

export default function useCart() {
  const [items, setItems] = useState([]) // {id, name, price, qty}

  const add = (item) => {
    setItems(prev => {
      const i = prev.find(x => x.id === item.id)
      if (i) return prev.map(x => x.id === item.id ? {...x, qty: x.qty + 1} : x)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const remove = (id) => setItems(prev => prev.filter(x => x.id !== id))
  const inc = (id) => setItems(prev => prev.map(x => x.id === id ? {...x, qty: x.qty + 1} : x))
  const dec = (id) => setItems(prev => prev.map(x => x.id === id ? {...x, qty: Math.max(1, x.qty - 1)} : x))

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)

  return { items, add, remove, inc, dec, total }
}

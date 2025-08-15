import Stripe from 'stripe'
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()
const db = admin.firestore()

// Set via: firebase functions:config:set stripe.secret="sk_live_..." stripe.webhook="whsec_..."
const stripe = new Stripe(process.env.STRIPE_SECRET || functions.config().stripe?.secret)

export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  const { orderId, items, currency } = data

  const line_items = items.map(i => ({
    price_data: {
      currency,
      product_data: { name: i.name },
      unit_amount: i.amount
    },
    quantity: i.quantity
  }))

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items,
    success_url: functions.config().app?.success_url || 'http://localhost:5173/success',
    cancel_url: functions.config().app?.cancel_url || 'http://localhost:5173/checkout',
    metadata: { orderId }
  })

  return { id: session.id, url: session.url }
})

// Webhook to mark order as paid
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature']
  const endpointSecret = process.env.STRIPE_WEBHOOK || functions.config().stripe?.webhook
  let event

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret)
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const orderId = session.metadata?.orderId
    if (orderId) {
      await db.collection('orders').doc(orderId).update({ paid: true })
    }
  }
  res.json({ received: true })
})

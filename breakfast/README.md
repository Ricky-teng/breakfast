# 早餐店線上點餐（React + Tailwind + Firebase + Stripe）

## 快速開始
1. 安裝：`npm install`
2. 啟動：`npm run dev`
3. 修改 `src/services/firebase.js` 放入你的 Firebase 設定

## Stripe（線上付款）
- 需要開通 Firebase 計費方案（Functions 需要）。
- 在 `functions` 目錄：
  - `npm install`
  - 設定機密：  
    `firebase functions:config:set stripe.secret="sk_test_xxx" stripe.webhook="whsec_xxx" app.success_url="https://你的網域/success" app.cancel_url="https://你的網域/checkout"`
  - 部署：`firebase deploy --only functions`
- 在 Stripe 後台建立 webhook 指向：`https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/stripeWebhook`

## PWA
- 已含 manifest 與 Service Worker，部署到 HTTPS 主機即可「安裝」成類似 App。

## 店內接單（平板）
- 直接開 `/#/admin`（本專案是 `/admin` 路由），可即時看到新訂單並切換狀態。

## Firestore 規則
- 客戶端可建立訂單 `orders`。  
- 讀/改/刪只允許登入（建議店內後台登入後使用）。

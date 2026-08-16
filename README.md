# 美上美早餐店 訂單看板

客人用 LINE 傳訊息點餐 → LINE 官方帳號透過 Webhook 把訊息傳到這個網站 → 存進資料庫 → 店內平板打開 `/board` 即時看到訊息清單(誰傳的、傳了什麼、幾點傳的)。

不做菜單客製化解析,直接顯示客人打的原始文字。

**看板功能**
- 新訂單進來會有提示音+短暫閃爍,避免店員沒注意到
- 三種狀態:新訂單(琥珀色)→ 店員點「開始製作」後變製作中(藍色,同時會發一則 LINE 訊息通知客人「開始製作囉」)→ 「標記完成」
- 訂單超過 5 分鐘還沒完成會自動變紅色提醒,方便尖峰時段抓漏單
- LINE 如果因為逾時重送同一則訊息(webhook 重試機制),系統會自動辨識並跳過,不會出現重複訂單

## 架構

```
客人 LINE 訊息 → LINE 官方帳號 → Webhook → /api/line/webhook
                                              │
                                    存進資料庫(暱稱/文字/時間)
                                              │
                                    店內平板打開 /board 顯示清單
```

## 需要準備的東西

1. **LINE 官方帳號**(不是個人帳號):到 [LINE 官方帳號 Manager](https://manager.line.biz) 申請
2. **LINE Developers Console**:到 [developers.line.biz](https://developers.line.biz) 用同一組帳號登入,建立一個 **Messaging API channel**,取得:
   - `Channel secret`
   - `Channel access token`(要在 Messaging API 設定頁手動簽發一個長期用的 token)
3. **資料庫**:正式環境建議用 [Supabase](https://supabase.com) 或 Vercel Postgres 的免費方案,拿到連線字串
4. **平板登入用的 PIN 碼**:自己設一組數字或英數字,店員每次打開平板時輸入

## 本機開發設定

1. 安裝套件

```bash
npm install
```

2. 複製 `.env.example` 為 `.env`,填入下列變數:

```
DATABASE_URL=            # 見下方「本機資料庫」
LINE_CHANNEL_SECRET=     # LINE Developers Console 取得
LINE_CHANNEL_ACCESS_TOKEN=
BOARD_PIN=                # 自己設定的平板登入 PIN
```

3. **本機資料庫**(不需要另外安裝 Postgres):

```bash
npx prisma dev
```

這個指令會在本機啟動一個 Postgres,並印出一組 `DATABASE_URL`,複製貼到 `.env`(每次重新執行連線字串的 port 可能不同,要更新)。

4. 建立資料表:

```bash
npx prisma migrate dev
```

5. 啟動網站:

```bash
npm run dev
```

打開 [http://localhost:3000](http://localhost:3000),沒有登入會自動導到 `/login`,輸入你設定的 `BOARD_PIN` 進入 `/board`。

## 把 LINE 官方帳號接上來

1. 部署到 Vercel(或其他有公開 HTTPS 網址的平台)後,會拿到一個網址,例如 `https://your-app.vercel.app`
2. 到 LINE Developers Console 的 Messaging API 設定頁,把 **Webhook URL** 設成:
   `https://your-app.vercel.app/api/line/webhook`
3. 開啟「Use webhook」
4. 在 LINE 官方帳號 Manager 裡,把「自動回應訊息」關閉(不然客人傳訊息會收到罐頭回覆,而不是被你的系統接收)
5. 拿手機用 LINE 加該官方帳號好友,傳一則文字訊息測試,應該幾秒內就會出現在 `/board`

## 部署(Vercel)

1. 把這個專案推上 GitHub
2. 到 [vercel.com](https://vercel.com) 匯入專案
3. 在 Vercel 的環境變數設定裡填入 `DATABASE_URL`、`LINE_CHANNEL_SECRET`、`LINE_CHANNEL_ACCESS_TOKEN`、`BOARD_PIN`(正式環境的資料庫連線字串,不要用本機 `prisma dev` 那組)
4. 部署完成後,回到上一步驟把 Webhook URL 設定好

## 平板怎麼用

平板瀏覽器打開你的網址(例如 `https://your-app.vercel.app`),輸入 PIN 碼後停在 `/board` 頁面即可,畫面每 4 秒自動更新。建議把瀏覽器設成全螢幕/加到主畫面,並讓平板螢幕保持常亮。

## 目前範圍之外(以後再說)

- 不做客人自助線上點餐介面
- 不做文字自動轉換成標準菜單品項(目前顯示原始文字)

## 部署疑難排解

如果 Vercel 上用的是 Prisma Postgres 整合(而不是自己接的 Postgres),它會自動建立好幾組資料庫相關的環境變數,其中 `DATABASE_URL` 是 Accelerate 代理格式(`prisma+postgres://...`),`pg`/`@prisma/adapter-pg` 讀不懂。程式碼已經處理好這個狀況:會優先讀取 `DATABASE_POSTGRES_URL`(直連格式),沒有的話才退回讀 `DATABASE_URL`,兩種來源都能正常運作,不需要手動改 Vercel 上的環境變數。

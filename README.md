# 美上美早餐店 點餐系統

客人可以透過兩種管道下單,店家在同一個看板上處理:

1. **LINE 訊息**:客人傳文字訊息給 LINE 官方帳號 → Webhook 存進資料庫,顯示原始文字(不解析)
2. **線上點餐**(`/menu`):客人瀏覽菜單、客製化、加入購物車、填姓名電話送出(到店付現金)

兩種訂單都會出現在 `/board`,用小圖示區分來源。

## 網址

- `/`(根目錄)→ 自動導到 `/menu`,客人點餐用
- `/menu`:客人點餐頁,公開不用登入
- `/order/[id]`:客人查詢自己訂單狀態,送出訂單後自動導過去
- `/board`:店內看板,需要 PIN 登入
- `/admin/menu`:菜單管理後台,需要 PIN 登入

## 看板功能(`/board`)

- 新訂單進來會有提示音+短暫閃爍
- 三種狀態:新訂單(琥珀色)→ 點「開始製作」變製作中(藍色)→「標記完成」
- LINE 訂單在「開始製作」「標記完成」時會發 LINE 訊息通知客人;網路訂單目前沒有 LINE 綁定,客人自己在 `/order/[id]` 查看進度
- 訂單超過 5 分鐘還沒完成自動變紅色提醒
- LINE webhook 重試不會造成重複訂單
- 每天凌晨 00:00(台灣時間)自動清空 **LINE 訊息**紀錄(網路訂單不會自動清空,因為有客人姓名電話金額,比較像正式銷售紀錄想保留;如果也想清空跟開發者說一聲)
- 連不上伺服器時畫面頂端會有紅色提示條

## 架構

```
客人 LINE 訊息 ─┐
                 ├─▶ /api/board(合併兩種來源)─▶ /board 看板
客人 /menu 下單 ─┘

/menu 送出訂單 → POST /api/orders(後端重新計價驗證,不信任前端金額)
              → 導到 /order/[id] 查詢狀態
```

## 需要準備的東西

1. **LINE 官方帳號**(不是個人帳號):到 [LINE 官方帳號 Manager](https://manager.line.biz) 申請
2. **LINE Developers Console**:到 [developers.line.biz](https://developers.line.biz) 建立 **Messaging API channel**,取得 `Channel secret` 和 `Channel access token`
3. **資料庫**:PostgreSQL(正式環境用 Vercel/Supabase 的免費方案)
4. **平板/後台登入用的 PIN 碼**:自己設一組數字或英數字

## 本機開發設定

1. 安裝套件

```bash
npm install
```

2. 複製 `.env.example` 為 `.env`,填入下列變數:

```
DATABASE_URL=              # 見下方「本機資料庫」
LINE_CHANNEL_SECRET=       # LINE Developers Console 取得
LINE_CHANNEL_ACCESS_TOKEN=
BOARD_PIN=                  # 自己設定的登入 PIN
CRON_SECRET=                # 隨機字串,保護每日清空訊息的 API
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

5. 匯入菜單資料:

```bash
npx tsx prisma/seed.ts
```

6. 啟動網站:

```bash
npm run dev
```

打開 [http://localhost:3000](http://localhost:3000) 會看到點餐頁;`/board`、`/admin/menu` 會先導到 `/login`,輸入 `BOARD_PIN` 登入。

## 把 LINE 官方帳號接上來

1. 部署到 Vercel(或其他有公開 HTTPS 網址的平台)後,會拿到一個網址,例如 `https://your-app.vercel.app`
2. 到 LINE Developers Console 的 Messaging API 設定頁,把 **Webhook URL** 設成:
   `https://your-app.vercel.app/api/line/webhook`
3. 開啟「Use webhook」
4. 在 LINE 官方帳號 Manager 裡,把「自動回應訊息」關閉(不然客人傳訊息會收到罐頭回覆,而不是被系統接收)
5. 拿手機傳一則文字訊息測試,應該幾秒內出現在 `/board`

## 部署(Vercel)

1. 把這個專案推上 GitHub,到 [vercel.com](https://vercel.com) 匯入專案
2. 在 Vercel 環境變數填入 `DATABASE_URL`、`LINE_CHANNEL_SECRET`、`LINE_CHANNEL_ACCESS_TOKEN`、`BOARD_PIN`、`CRON_SECRET`(正式環境的資料庫連線字串,不要用本機 `prisma dev` 那組)
3. 部署完成後,回到上一步驟把 Webhook URL 設定好
4. **到 `/admin/menu` 點一次「重新匯入預設菜單」**,把菜單資料匯進正式環境的資料庫(只有第一次要做;這支 API 只要資料庫裡已經有真實訂單就會拒絕執行,不用擔心之後誤觸清空)
5. `vercel.json` 已設定好每天台灣時間 00:00 自動清空 LINE 訊息,Vercel 會自動排程,不用額外設定

## 平板怎麼用

平板瀏覽器直接開 `https://your-app.vercel.app/board`(注意是 `/board`,不是根目錄——根目錄是客人點餐頁),輸入 PIN 碼後畫面每 4 秒自動更新。建議把瀏覽器設成全螢幕/加到主畫面,並讓平板螢幕保持常亮。

## 目前範圍之外(以後再說)

- 不做文字自動轉換成標準菜單品項(LINE 訊息目前顯示原始文字)
- 不做線上金流(目前都是到店付現金)
- 不包裝成 App(目前是網頁,PWA/App 化之後再說)

## 部署疑難排解

如果 Vercel 上用的是 Prisma Postgres 整合(而不是自己接的 Postgres),它會自動建立好幾組資料庫相關的環境變數,其中 `DATABASE_URL` 是 Accelerate 代理格式(`prisma+postgres://...`),`pg`/`@prisma/adapter-pg` 讀不懂。程式碼已經處理好這個狀況:會優先讀取 `DATABASE_POSTGRES_URL`(直連格式),沒有的話才退回讀 `DATABASE_URL`,兩種來源都能正常運作,不需要手動改 Vercel 上的環境變數。

# muxbir-ai-front-vue — yangi serverga ko'chirish

Vue 3 + Vite SPA, statik build qilinib nginx orqali xizmat qiladi, domen `muxbir.ai` / `www.muxbir.ai`.
Backend bilan birga ko'chirilishi kerak — ushbu papkadagi [BACKEND_MIGRATION.md](./BACKEND_MIGRATION.md) ni avval bajaring, chunki nginx `/api/` so'rovlarini `127.0.0.1:4001` dagi backendga uzatadi.

## 0. Talablar

- Node.js **v20.x**
- nginx + certbot

## 1. Kodni olish

```bash
cd /var/www
git clone git@github.com:Alfraganus/muxbir-ai-front-vue.git muxbir-ai-front-vue
cd muxbir-ai-front-vue
npm install
```

Repo **public emas** — yangi server SSH deploy key'i GitHub'da ruxsat etilgan bo'lishi kerak.

## 2. `.env`

```bash
scp root@<eski-server-ip>:/var/www/muxbir-ai-front-vue/.env /var/www/muxbir-ai-front-vue/.env
```

Yagona kalit:

```
VITE_TELEGRAM_BOT_ID=<raqamli bot ID, token emas>
```

(Token `1234567890:AABBcc...` bo'lsa, ID — `1234567890` qismi; backend'dagi `TELEGRAM_BOT_TOKEN` bilan bir xil botga tegishli bo'lishi shart.)

## 3. Build

```bash
npm run build     # vite build -> dist/
```

Production'da API manzili avtomatik `/api` (nisbiy) ga o'tadi (`src/api/base.js`: `import.meta.env.PROD ? '/api' : 'http://localhost:4001'`) — nginx shu `/api/` so'rovlarini backendga proxy qiladi, qo'shimcha env kerak emas.

## 4. nginx + SSL (`muxbir.ai`)

```nginx
server {
    server_name muxbir.ai www.muxbir.ai;

    root /var/www/muxbir-ai-front-vue/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:4001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        client_max_body_size 20M;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    client_max_body_size 20M;
    listen 80;
}
```

```bash
ln -s /etc/nginx/sites-available/muxbir.ai /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d muxbir.ai -d www.muxbir.ai
```

DNS: `muxbir.ai` va `www.muxbir.ai` A-yozuvlarini yangi server IP'siga yo'naltiring.

## 5. Tekshirish

```bash
curl -I https://muxbir.ai
```

Brauzerda saytni oching, login qiling, Telegram Login Widget ishlashini tekshiring (bot ID noto'g'ri bo'lsa — widget sukut saqlaydi/xato beradi).

## Eslatma

- Agar domen **o'zgarsa** (yangi serverda boshqa domen ishlatilsa), backend `.env` dagi `FRONTEND_URL`, `APP_URL`, `META_REDIRECT_URI`, `CLICK_RETURN_URL` qiymatlarini ham yangi domenga moslab yangilang — aks holda OAuth redirect va to'lov qaytish sahifalari ishlamaydi.
- Frontend va backend bitta domen ostida (`muxbir.ai` + `api.muxbir.ai`) ishlashi uchun ikkalasi ham shu qo'llanmalar bo'yicha ketma-ket ko'chirilishi kerak.

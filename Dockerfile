# === 第一階段：build Vite 專案 ===
FROM node:20-alpine AS build

WORKDIR /app

# 先只 copy 套件資訊，加快快取
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# 再把專案源碼丟進來
COPY . .

# Vite build，會輸出到 dist/
RUN yarn build


# === 第二階段：用 Nginx 檔案伺服器跑 ===
FROM nginx:1.27-alpine

# 把 build 出來的靜態檔拷貝到 nginx 預設目錄
COPY --from=build /app/dist /usr/share/nginx/html

# 自訂 nginx 設定（確保 SPA 刷新不 404）
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
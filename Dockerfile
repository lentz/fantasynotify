FROM node:26-alpine

WORKDIR /app

COPY package-lock.json package.json ./
RUN npm ci

COPY . .

ENV DOMAIN=https://fantasynotify.fly.dev
ENV PORT=8080

EXPOSE $PORT

CMD ["node", "./app.ts"]

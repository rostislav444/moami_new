FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* ./
RUN yarn install --frozen-lockfile 2>/dev/null || yarn install

COPY . .

EXPOSE 3000

CMD ["yarn", "dev"]

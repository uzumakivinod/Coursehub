FROM node:20-alpine
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 worker

COPY package*.json ./
RUN npm install --omit=dev

COPY --chown=worker:nodejs . .

USER worker
ENV NODE_ENV=production

CMD ["node", "src/index.js"]
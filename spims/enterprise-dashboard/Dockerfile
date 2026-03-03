FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 4200
ENV PORT=4200
CMD ["node", "dist/enterprise-dashboard/server/server.mjs"]

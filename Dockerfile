FROM node:25-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

FROM node:25-alpine
WORKDIR /app
COPY --from=builder /app /app
EXPOSE 3000
CMD ["npm", "start"]

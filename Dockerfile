FROM oven/bun:1.4.2-alpine AS build
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install
COPY . .

FROM oven/bun:1.4.2-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 3000
CMD ["bun", "run", "bin/server.ts"]

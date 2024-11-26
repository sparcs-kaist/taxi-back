#
# First stage: build the app
#
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Install pnpm
RUN npm install --global pnpm@8.8.0

# pnpm fetch does require only lockfile
COPY pnpm-lock.yaml .
RUN pnpm fetch

COPY . .
RUN pnpm install --offline
RUN pnpm build

#
# Second stage: run the app
#
FROM node:18-alpine

WORKDIR /usr/src/app

RUN npm install --global pnpm@8.8.0

COPY pnpm-lock.yaml .
RUN pnpm fetch --prod

COPY package.json .
RUN pnpm install --prod

COPY --from=builder /usr/src/app/dist dist

# Run container
EXPOSE 80
ENV PORT 80
CMD ["pnpm", "serve"]

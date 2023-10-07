FROM node:18-alpine

WORKDIR /usr/src/app

# Install curl(for taxi-watchtower) and pnpm
RUN apk update && apk add curl && npm install --global pnpm@8.8.0

# pnpm fetch does require only lockfile
COPY pnpm-lock.yaml .

# Note: devDependencies are not fetched
RUN pnpm fetch --prod

# Copy repository and install dependencies
ADD . ./
RUN pnpm install --offline --prod

# Run container
EXPOSE 80
ENV PORT 80
CMD ["pnpm", "run", "serve"]

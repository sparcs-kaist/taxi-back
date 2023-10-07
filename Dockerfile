FROM node:18-alpine

# Copy repository
WORKDIR /usr/src/app
COPY . .

# Install curl (for taxi-docker)
RUN apk update && apk add curl
RUN npm install --global pnpm@8.8.0

# Install requirements
RUN pnpm i --force --frozen-lockfile

# Run container
EXPOSE 80
ENV PORT 80
CMD ["pnpm", "run", "serve"]


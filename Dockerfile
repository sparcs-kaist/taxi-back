FROM node:16-alpine

# Copy repository
WORKDIR /usr/src/app
COPY . .

# Install curl (for taxi-docker)
RUN apk update && apk add curl
RUN npm install --global pnpm@8.6.6 serve@14.1.2

# Install requirements
RUN pnpm install

# Run container
EXPOSE 80
ENV PORT 80
CMD ["pnpm", "run", "serve"]


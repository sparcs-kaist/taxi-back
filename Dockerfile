FROM node:16-alpine

# Copy repository
WORKDIR /usr/src/app
COPY . .

# Install curl (for taxi-docker)
RUN apk update && apk add curl

# Install requirements
RUN npm ci

# Run container
EXPOSE 80
ENV PORT 80
CMD ["npm", "run", "serve"]

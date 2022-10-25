FROM node:16-alpine

# Install git
RUN apk add --no-cache \
  git

# Clone repository
WORKDIR /usr/src/app
COPY . .

# Install requirements
RUN npm install

# Run container
EXPOSE 80
ENV PORT 80
CMD ["npm", "run", "start"]
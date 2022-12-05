FROM mongo:4.4

# Copy repository
WORKDIR /usr/src/app
COPY . .

# Install requirements
RUN npm ci

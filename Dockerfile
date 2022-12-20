FROM mongo:4.4

# Copy repository
WORKDIR /home
COPY . .
ENV DB_PATH mongodb://localhost:27017/local
ENV NUM_OF_ROOMS 2
ENV NUM_OF_CHATS 200
ENV MAXIMUM_INTERVAL_BETWEEN_CHATS 20
ENV OCCURENCE_OF_JOIN 0.1
ENV OCCURENCE_OF_ABORT 0.1

# Download nvm
RUN apt-get -qq update; \
    apt-get -qq install curl; \
    curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash; \
    mv /data/db/.nvm /home/.nvm

# Start mongo service \
# Install node (from nvm) \
# Run taxi-sampleGenerator
ENV NODE_VERSION v16.15.0
ENV DB_STORAGE /home/db
RUN mkdir $DB_STORAGE; \
    mongod --fork --syslog --dbpath $DB_STORAGE; \
    . /home/.nvm/nvm.sh; \
    nvm install $NODE_VERSION; \
    nvm use --delete-prefix $NODE_VERSION; \
    npm install; \
    npm start; \
    mongod --shutdown --dbpath $DB_STORAGE

# Start mongo service
EXPOSE 27017
CMD ["sh", "-c", "cp -rf $DB_STORAGE /data && mongod"]

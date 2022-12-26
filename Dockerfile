FROM mongo:4.4

# Install node & npm (from nvm)
ENV NODE_VERSION v16.15.0
RUN apt-get -qq update; \
    apt-get -qq install curl; \
    curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash; \
    . /data/db/.nvm/nvm.sh; \
    nvm install $NODE_VERSION; \
    nvm alias default $NODE_VERSION; \
    nvm use --delete-prefix default
ENV PATH /bin/versions/node/$NODE_VERSION/bin:$PATH

# Copy repository and Set default environments
WORKDIR /home
COPY . .
ENV DB_PATH=mongodb://localhost:27017/local \
    NUM_OF_ROOMS=2 \
    NUM_OF_CHATS=200 \
    MAXIMUM_INTERVAL_BETWEEN_CHATS=20 \
    OCCURENCE_OF_JOIN=0.1 \
    OCCURENCE_OF_ABORT=0.1

# Install requirements
RUN npm install

# Start mongo service
EXPOSE 27017
CMD ["sh", "-c", "mongod & npm start & tail -f /dev/null"]

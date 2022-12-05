FROM mongo:4.4

# Copy repository
WORKDIR /home
COPY . .

# Install
RUN apt-get -qq update
RUN apt-get -qq install curl
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.3/install.sh | bash
RUN source install_nvm

# Install
RUN mongod &
RUN 
RUN mongod --shutdown

# Start service
EXPOSE 27017
CMD ["mongod"]

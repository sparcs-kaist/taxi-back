FROM mongo:4.4

# Copy repository
WORKDIR /home
COPY . .

# 
WORKDIR /home
ENTRYPOINT ["docker-entrypoint.sh"]
EXPOSE 27017
CMD ["mongod"]

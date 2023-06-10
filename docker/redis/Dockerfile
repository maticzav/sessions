FROM redis:7-alpine

COPY docker/redis/redis.conf /usr/local/etc/redis/redis.conf
COPY docker/redis/start.sh /usr/bin/start.sh

CMD ["/usr/bin/start.sh"]

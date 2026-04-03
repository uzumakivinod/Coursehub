FROM nginx:1.25-alpine

# Remove default configs
RUN rm -f /etc/nginx/conf.d/default.conf /etc/nginx/nginx.conf

# Copy our config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
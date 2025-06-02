FROM nginx:1.25

# Remove the default configuration file provided by the Nginx image
RUN rm /etc/nginx/conf.d/default.conf

# Copy your custom Nginx configuration file
COPY nginx.conf_v2 /etc/nginx/nginx.conf

# Copy proxy params if required by your configuration
COPY proxy_params /etc/nginx/proxy_params

COPY *.html /usr/share/nginx/html/

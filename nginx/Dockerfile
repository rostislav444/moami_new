FROM nginx:1.25-alpine

# Install dependencies for building GeoIP2 module
RUN apk add --no-cache \
    gcc \
    libc-dev \
    make \
    openssl-dev \
    pcre-dev \
    zlib-dev \
    linux-headers \
    libmaxminddb-dev \
    git

# Download and build ngx_http_geoip2_module
WORKDIR /tmp
RUN git clone --depth 1 https://github.com/leev/ngx_http_geoip2_module.git

# Get nginx version and download source
RUN NGINX_VERSION=$(nginx -v 2>&1 | sed -n 's|.*nginx/||p' | cut -d' ' -f1) && \
    wget http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz && \
    tar -xzvf nginx-${NGINX_VERSION}.tar.gz

# Build dynamic module
RUN NGINX_VERSION=$(nginx -v 2>&1 | sed -n 's|.*nginx/||p' | cut -d' ' -f1) && \
    cd nginx-${NGINX_VERSION} && \
    ./configure --with-compat --add-dynamic-module=../ngx_http_geoip2_module && \
    make modules && \
    cp objs/ngx_http_geoip2_module.so /usr/lib/nginx/modules/

# Clean up build dependencies
RUN apk del gcc libc-dev make openssl-dev pcre-dev zlib-dev linux-headers git && \
    rm -rf /tmp/*

# Install runtime dependency
RUN apk add --no-cache libmaxminddb

# Remove the default configuration file
RUN rm /etc/nginx/conf.d/default.conf

# Copy GeoIP database
RUN mkdir -p /usr/share/GeoIP
COPY GeoLite2-Country.mmdb /usr/share/GeoIP/

# Copy configuration files
COPY nginx.conf_v2 /etc/nginx/nginx.conf
COPY proxy_params /etc/nginx/proxy_params
COPY *.html /usr/share/nginx/html/

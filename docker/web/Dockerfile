FROM php:8.2-apache

ENV COMPOSER_ALLOW_SUPERUSER=1

# Dependências de sistema necessárias às extensões do Laravel
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libonig-dev \
        libzip-dev \
    && rm -rf /var/lib/apt/lists/*

# Extensões PHP exigidas pelo Laravel + driver MySQL
RUN docker-php-ext-install pdo_mysql mbstring zip

# Composer (útil para instalar dependências em clones novos)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Módulos Apache necessários ao .htaccess da raiz (SPA + Laravel)
RUN a2enmod rewrite headers

WORKDIR /var/www/html

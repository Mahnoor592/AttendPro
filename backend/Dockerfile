# Laravel 13 API — production image for Railway
FROM php:8.3-cli

# System packages + PHP extensions Laravel + MySQL need
RUN apt-get update && apt-get install -y \
        git \
        unzip \
        libzip-dev \
        libonig-dev \
    && docker-php-ext-install pdo_mysql mbstring bcmath zip \
    && rm -rf /var/lib/apt/lists/*

# Composer (copied from the official Composer image)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy the app and install PHP dependencies (production only)
COPY . .
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress

# Railway provides $PORT at runtime; run migrations then start the server
CMD php artisan migrate --force && php artisan serve --host 0.0.0.0 --port ${PORT:-8080}

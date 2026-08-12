<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 2. IMPORTANTE: Limita o tamanho padrão das strings de índice para 191 caracteres
        // 191 x 4 bytes = 764 bytes (totalmente seguro para o limite de 1000 bytes do MySQL)
        Schema::defaultStringLength(191);
    }
}

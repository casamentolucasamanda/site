<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Ativa o seeder de usuários criado acima
        $this->call([
            UserSeeder::class,
        ]);
    }
}

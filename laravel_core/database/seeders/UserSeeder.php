<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Cadastro da Conta dos Noivos (Administradores)
        User::firstOrCreate(
            ['username' => 'usuario'],
            [
                'name' => 'usuario',
                'email' => 'usuario@gmail.com',
                'password' => Hash::make('senha'),
                'role' => 'noivos',
            ]
        );

        // 2. Cadastro de um Convidado de Teste
        User::firstOrCreate(
            ['username' => 'convidado'],
            [
                'name' => 'Família Silva (Convidado Teste)',
                'password' => Hash::make('casamento2026'),
                'role' => 'convidado',
            ]
        );
    }
}

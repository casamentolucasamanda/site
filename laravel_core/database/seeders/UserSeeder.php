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
        User::create([
            'name' => 'usuario',
            'username' => 'usuario',
            'email' => 'usuario@gmail.com',
            'password' => Hash::make('senha'), // Defina uma senha segura
            'role' => 'role',
        ]);

        // 2. Cadastro de um Convidado de Teste
        User::create([
            'name' => 'Família Silva (Convidado Teste)',
            'username' => 'convidado',
            'password' => Hash::make('casamento2026'), // Senha simples para os convidados acessarem
            'role' => 'role',
        ]);
    }
}

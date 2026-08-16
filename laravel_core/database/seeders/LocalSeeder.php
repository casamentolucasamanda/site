<?php

namespace Database\Seeders;

use App\Models\Local;
use Illuminate\Database\Seeder;

class LocalSeeder extends Seeder
{
    public function run(): void
    {
        Local::updateOrCreate(
            ['tipo' => 'CERIMONIA'],
            [
                'horario' => '11h',
                'nome' => 'Cartório de Registro Civil',
                'endereco' => 'Rua das Flores, nº 123 - Centro',
                'cidade_uf' => 'Cidade do Casamento - UF',
                'mapa_iframe' => '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3969.3179261899127!2d-35.263889!3d-5.910000!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNcKwNTQnMzYuMCJTIDM1wrAxNSc1MC4wIlc!5e0!3m2!1wpt-BR!2sbr!4v1600000000000!5m2!1wpt-BR!2sbr" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>',
            ]
        );

        Local::updateOrCreate(
            ['tipo' => 'RECEPCAO'],
            [
                'horario' => '12h30',
                'nome' => 'Espaço Jardim dos Sonhos',
                'endereco' => 'Avenida das Flores, nº 1500 - Bairro Primavera',
                'cidade_uf' => 'Cidade do Casamento - UF',
                'mapa_iframe' => '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3969.3179261899127!2d-35.263889!3d-5.910000!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNcKwNTQnMzYuMCJTIDM1wrAxNSc1MC4wIlc!5e0!3m2!1wpt-BR!2sbr!4v1600000000000!5m2!1wpt-BR!2sbr" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>',
            ]
        );
    }
}

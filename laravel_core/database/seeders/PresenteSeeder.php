<?php

namespace Database\Seeders;

use App\Models\Presente;
use Illuminate\Database\Seeder;

class PresenteSeeder extends Seeder
{
    public function run(): void
    {
        $presentes = [
            [
                'nome' => 'Cotas para Lua de Mel em Cancún',
                'descricao' => 'Contribua para os noivos curtirem um jantar romântico à beira-mar.',
                'valor_estimado' => 250.00,
            ],
            [
                'nome' => 'Jogo de Panelas Antiaderentes Premium',
                'descricao' => 'Conjunto completo com 5 peças para a cozinha da casa nova.',
                'valor_estimado' => 380.00,
            ],
            [
                'nome' => 'Fritadeira Elétrica Air Fryer 4L',
                'descricao' => 'Praticidade e saúde no dia a dia do casal.',
                'valor_estimado' => 320.00,
            ],
            [
                'nome' => 'Cafeteira Elétrica com Jarra Inox',
                'descricao' => 'Café quentinho garantido todas as manhãs.',
                'valor_estimado' => 190.00,
            ],
            [
                'nome' => 'Aparelho de Jantar 20 Peças de Porcelana',
                'descricao' => 'Para receber a família e os amigos com todo o carinho.',
                'valor_estimado' => 450.00,
            ],
            [
                'nome' => 'Robô Aspirador de Pó Inteligente',
                'descricao' => 'Ajuda na limpeza diária para sobra mais tempo para o casal.',
                'valor_estimado' => 590.00,
            ],
        ];

        foreach ($presentes as $item) {
            Presente::firstOrCreate(
                ['nome' => $item['nome']],
                [
                    'descricao' => $item['descricao'],
                    'valor_estimado' => $item['valor_estimado'],
                ]
            );
        }
    }
}

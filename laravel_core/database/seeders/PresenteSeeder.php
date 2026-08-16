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
                'imagem_url' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'nome' => 'Jogo de Panelas Antiaderentes Premium',
                'descricao' => 'Conjunto completo com 5 peças para a cozinha da casa nova.',
                'valor_estimado' => 380.00,
                'imagem_url' => 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'nome' => 'Fritadeira Elétrica Air Fryer 4L',
                'descricao' => 'Praticidade e saúde no dia a dia do casal.',
                'valor_estimado' => 320.00,
                'imagem_url' => 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'nome' => 'Cafeteira Elétrica com Jarra Inox',
                'descricao' => 'Café quentinho garantido todas as manhãs.',
                'valor_estimado' => 190.00,
                'imagem_url' => 'https://images.unsplash.com/photo-1517668808822-9ebe02f2a698?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'nome' => 'Aparelho de Jantar 20 Peças de Porcelana',
                'descricao' => 'Para receber a família e os amigos com todo o carinho.',
                'valor_estimado' => 450.00,
                'imagem_url' => 'https://images.unsplash.com/photo-1615865417236-d67f9104fa28?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'nome' => 'Robô Aspirador de Pó Inteligente',
                'descricao' => 'Ajuda na limpeza diária para sobra mais tempo para o casal.',
                'valor_estimado' => 590.00,
                'imagem_url' => 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=600&q=80',
            ],
        ];

        foreach ($presentes as $item) {
            Presente::firstOrCreate(
                ['nome' => $item['nome']],
                [
                    'descricao' => $item['descricao'],
                    'valor_estimado' => $item['valor_estimado'],
                    'imagem_url' => $item['imagem_url'],
                ]
            );
        }
    }
}

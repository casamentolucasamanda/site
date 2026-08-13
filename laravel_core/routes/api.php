<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Artisan;






// --- ROTAS PÚBLICAS DE AUTENTICAÇÃO ---
// Endpoint de login (Usado tanto por Lucas & Amanda quanto pelos convidados)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::get('/debug-auth', function (Request $request) {
    return response()->json([
        'check' => auth('web')->check(),
        'user' => auth('web')->user(),
        'session_id' => $request->session()->getId(),
        'all_session_data' => $request->session()->all(),
    ]);
});
// --- ROTAS PROTEGIDAS PELO SANCTUM ---
// Qualquer usuário logado (noivos ou convidados) consegue acessar este grupo
Route::middleware('auth:sanctum')->group(function () {
    
    // Apenas os noivos podem cadastrar novos convidados ou novos usuários
    Route::post('/usuarios/cadastrar', [AuthController::class, 'register']);
    
    Route::get('/painel-noivos/resumo', function () {
        // Lógica do painel de controle...
    });
    
    // Retorna os dados do usuário atual (Útil para a SPA checar se ainda está logado)
    Route::get('/user', function (Request $request) {
        return response()->json($request->user());
    });
    
    // Endpoints para ações dos convidados
    Route::get('/presenca', function (Request $request) {
        $presenca = App\Models\Presenca::where('user_id', $request->user()->id)->first();
        return response()->json([
            'ja_respondido' => !is_null($presenca),
            'confirmado' => $presenca ? (bool)$presenca->confirmado : null,
            'observacoes' => $presenca ? $presenca->observacoes : '',
            'updated_at' => $presenca && $presenca->updated_at ? $presenca->updated_at->format('d/m/Y \à\s H:i') : null,
        ]);
    });

    Route::post('/confirmar-presenca', function (Request $request) {
        $validated = $request->validate([
            'confirmado' => ['required', 'boolean'],
            'observacoes' => ['nullable', 'string', 'max:500'],
        ]);

        $presenca = App\Models\Presenca::updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'confirmado' => $validated['confirmado'],
                'observacoes' => $validated['observacoes'] ?? '',
                'acompanhantes' => 0,
            ]
        );

        return response()->json([
            'status' => 'sucesso',
            'mensagem' => $presenca->confirmado ? 'Presença confirmada com sucesso! Aguardamos você.' : 'Sua resposta de ausência foi registrada. Sentiremos sua falta!',
            'presenca' => [
                'confirmado' => (bool)$presenca->confirmado,
                'observacoes' => $presenca->observacoes,
            ]
        ]);
    });

    Route::get('/presentes', function () {
        $presentes = App\Models\Presente::with('comprador:id,name')->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'nome' => $p->nome,
                'descricao' => $p->descricao,
                'valor_estimado' => (float)$p->valor_estimado,
                'valor_formatado' => 'R$ ' . number_format($p->valor_estimado, 2, ',', '.'),
                'reservado' => !is_null($p->user_id),
                'reservado_por_mim' => $p->user_id === auth()->id(),
                'comprador' => $p->comprador ? $p->comprador->name : null,
            ];
        });
        return response()->json($presentes);
    });

    Route::post('/escolher-presente', function (Request $request) {
        $validated = $request->validate([
            'presente_id' => ['required', 'string', 'exists:presentes,id']
        ]);

        $presente = App\Models\Presente::findOrFail($validated['presente_id']);

        if ($presente->user_id && $presente->user_id !== $request->user()->id) {
            return response()->json([
                'status' => 'erro',
                'mensagem' => 'Este presente já foi reservado por outro convidado.'
            ], 422);
        }

        $presente->user_id = $request->user()->id;
        $presente->save();

        $valorFormatado = 'R$ ' . number_format($presente->valor_estimado, 2, ',', '.');
        $chavePix = "noivos.lucasamanda@casamento.com.br";
        $pixPayload = "00020126580014BR.GOV.BCB.PIX0136" . $chavePix . "5204000053039865405" . sprintf("%.2f", $presente->valor_estimado) . "5802BR5920Lucas e Amanda6009SAO PAULO62070503***6304";
        $qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" . urlencode($pixPayload);

        return response()->json([
            'status' => 'sucesso',
            'mensagem' => 'Presente reservado com sucesso!',
            'presente' => [
                'id' => $presente->id,
                'nome' => $presente->nome,
                'valor' => $valorFormatado,
            ],
            'pix' => [
                'chave' => $chavePix,
                'payload' => $pixPayload,
                'qr_code_url' => $qrCodeUrl
            ]
        ]);
    });

    Route::get('/local', function () {
        return response()->json([
            'nome' => 'Espaço Jardim dos Sonhos',
            'endereco' => 'Avenida das Flores, nº 1500 - Bairro Primavera',
            'cidade_uf' => 'Cidade do Casamento - UF',
            'mapa_iframe' => '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3969.3179261899127!2d-35.263889!3d-5.910000!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNcKwNTQnMzYuMCJTIDM1wrAxNSc1MC4wIlc!5e0!3m2!1wpt-BR!2sbr!4v1600000000000!5m2!1wpt-BR!2sbr" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>'
        ]);
    });
});

// --- ROTAS EXCLUSIVAS DOS NOIVOS ---
// Além de estar logado, o usuário PRECISA ter a role 'noivos'
Route::middleware(['auth:sanctum', 'noivos'])->group(function () {
    
    // Endpoint para os noivos visualizarem os relatórios no Dashboard
    Route::get('/painel-noivos/resumo', function () {
        return response()->json([
            'total_convidados_confirmados' => 120,
            'presentes_ganhos' => 15,
            'lista_confirmados' => [
                ['nome' => 'Família Silva', 'acompanhantes' => 2],
                ['nome' => 'Tia Maria', 'acompanhantes' => 0]
            ]
        ]);
    });
});


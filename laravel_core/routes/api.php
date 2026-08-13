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
                'recebido' => (bool)$p->recebido,
                'comprador' => $p->comprador ? $p->comprador->name : null,
            ];
        });
        return response()->json($presentes);
    });

    // Mensagens enviadas pelos noivos ao convidado logado
    Route::get('/mensagens', function (Request $request) {
        $mensagens = App\Models\Mensagem::where('destinatario_id', $request->user()->id)
            ->with('presente:id,nome')
            ->orderByDesc('created_at')
            ->get();

        // Marca como lidas as mensagens recém-buscadas
        App\Models\Mensagem::where('destinatario_id', $request->user()->id)
            ->where('lida', false)
            ->update(['lida' => true]);

        return response()->json($mensagens->map(fn ($m) => [
            'id' => $m->id,
            'presente' => $m->presente ? $m->presente->nome : null,
            'mensagem' => $m->mensagem,
            'criado_em' => $m->created_at ? $m->created_at->format('d/m/Y \à\s H:i') : null,
        ]));
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
        $local = App\Models\Local::first();

        if (!$local) {
            return response()->json([
                'nome' => null,
                'endereco' => null,
                'cidade_uf' => null,
                'mapa_iframe' => null,
            ]);
        }

        return response()->json([
            'nome' => $local->nome,
            'endereco' => $local->endereco,
            'cidade_uf' => $local->cidade_uf,
            'mapa_iframe' => $local->mapa_iframe,
        ]);
    });
});

// --- ROTAS EXCLUSIVAS DOS NOIVOS ---
// Além de estar logado, o usuário PRECISA ter a role 'noivos'
Route::middleware(['auth:sanctum', 'noivos'])->group(function () {
    
    // Rota administrativa: apenas os noivos podem cadastrar novos convidados ou novos usuários
    Route::post('/usuarios/cadastrar', [AuthController::class, 'register']);

    // Endpoint para os noivos visualizarem os relatórios em tempo real no Dashboard
    Route::get('/painel-noivos/resumo', function () {
        $confirmados = App\Models\Presenca::where('confirmado', true)->with('user:id,name')->get();
        $naoConfirmados = App\Models\Presenca::where('confirmado', false)->count();
        $totalConvidados = App\Models\User::where('role', 'convidado')->count();

        $presentesGanhos = App\Models\Presente::whereNotNull('user_id')->get();
        $totalPresentes = App\Models\Presente::count();

        return response()->json([
            'total_convidados' => $totalConvidados,
            'total_convidados_confirmados' => $confirmados->count(),
            'total_convidados_nao_confirmaram' => $naoConfirmados,
            'total_aguardando_resposta' => max(0, $totalConvidados - $confirmados->count() - $naoConfirmados),
            'presentes_ganhos' => $presentesGanhos->count(),
            'presentes_disponiveis' => max(0, $totalPresentes - $presentesGanhos->count()),
            'valor_total_presentes' => (float)$presentesGanhos->sum('valor_estimado'),
            'lista_confirmados' => $confirmados->map(fn ($p) => [
                'nome' => $p->user->name ?? 'Desconhecido',
                'acompanhantes' => (int)$p->acompanhantes,
            ])->values(),
        ]);
    });

    // Lista os presentes reservados pelos convidados para gestão dos noivos
    Route::get('/painel-noivos/presentes', function () {
        $presentes = App\Models\Presente::whereNotNull('user_id')
            ->with(['comprador:id,name', 'mensagens'])
            ->orderByDesc('updated_at')
            ->get();

        return response()->json($presentes->map(fn ($p) => [
            'id' => $p->id,
            'nome' => $p->nome,
            'valor_formatado' => 'R$ ' . number_format($p->valor_estimado, 2, ',', '.'),
            'recebido' => (bool)$p->recebido,
            'comprador' => $p->comprador ? [
                'id' => $p->comprador->id,
                'name' => $p->comprador->name,
            ] : null,
            'mensagens' => $p->mensagens->sortByDesc('created_at')->values()->map(fn ($m) => [
                'id' => $m->id,
                'mensagem' => $m->mensagem,
                'criado_em' => $m->created_at ? $m->created_at->format('d/m/Y \à\s H:i') : null,
            ]),
        ]));
    });

    // Confirma o recebimento físico de um presente pelos noivos
    Route::post('/presentes/{presente}/receber', function (App\Models\Presente $presente) {
        if (!$presente->user_id) {
            return response()->json([
                'status' => 'erro',
                'mensagem' => 'Este presente ainda não foi reservado por nenhum convidado.'
            ], 422);
        }

        $presente->recebido = true;
        $presente->save();

        return response()->json([
            'status' => 'sucesso',
            'mensagem' => 'Recebimento do presente confirmado com sucesso!',
        ]);
    });

    // Cadastra um novo presente na lista de presentes pelos noivos
    Route::post('/presentes', function (Request $request) {
        $validated = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string', 'max:500'],
            'valor_estimado' => ['nullable', 'numeric', 'min:0'],
        ]);

        $presente = App\Models\Presente::create([
            'nome' => trim($validated['nome']),
            'descricao' => $validated['descricao'] ?? null,
            'valor_estimado' => $validated['valor_estimado'] ?? null,
        ]);

        return response()->json([
            'status' => 'sucesso',
            'mensagem' => 'Presente adicionado com sucesso!',
            'presente' => [
                'id' => $presente->id,
                'nome' => $presente->nome,
                'valor_formatado' => $presente->valor_estimado ? 'R$ ' . number_format($presente->valor_estimado, 2, ',', '.') : null,
            ],
        ], 201);
    });

    // Envia uma mensagem dos noivos ao convidado que reservou o presente
    Route::post('/presentes/{presente}/mensagem', function (Request $request, App\Models\Presente $presente) {
        $validated = $request->validate([
            'mensagem' => ['required', 'string', 'max:1000'],
        ]);

        if (!$presente->user_id) {
            return response()->json([
                'status' => 'erro',
                'mensagem' => 'Este presente ainda não foi reservado por nenhum convidado.'
            ], 422);
        }

        $mensagem = App\Models\Mensagem::create([
            'presente_id' => $presente->id,
            'remetente_id' => $request->user()->id,
            'destinatario_id' => $presente->user_id,
            'mensagem' => trim($validated['mensagem']),
        ]);

        return response()->json([
            'status' => 'sucesso',
            'mensagem' => 'Mensagem enviada ao convidado!',
            'mensagem_id' => $mensagem->id,
        ]);
    });

    // Executa as migrations do banco de dados (exclusivo dos noivos)
    Route::get('/admin/migrate', function () {
        Artisan::call('migrate', [
            '--force' => true,
        ]);

        return response()->json([
            'success' => true,
            'output' => Artisan::output(),
        ]);
    });
});


<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Artisan;

// --- HELPERS PIX (EMV QR Code) ---
// Calcula o CRC16-CCITT (polinômio 0x1021) do payload PIX
function calcularCrc16($payload)
{
    $crc = 0xFFFF;
    $length = strlen($payload);
    for ($i = 0; $i < $length; $i++) {
        $crc ^= (ord($payload[$i]) << 8);
        for ($j = 0; $j < 8; $j++) {
            if ($crc & 0x8000) {
                $crc = (($crc << 1) ^ 0x1021) & 0xFFFF;
            } else {
                $crc = ($crc << 1) & 0xFFFF;
            }
        }
    }
    return strtoupper(str_pad(dechex($crc), 4, '0', STR_PAD_LEFT));
}

// Monta o payload EMV válido do PIX a partir da configuração e do valor
function gerarPayloadPix($config, $valor)
{
    // Campo 26 — Merchant Account Information (br.gov.bcb.pix + chave)
    $maInfo = '0014BR.GOV.BCB.PIX' . '01' . str_pad(strlen($config->chave_pix), 2, '0', STR_PAD_LEFT) . $config->chave_pix;
    $payload = '000201';
    $payload .= '26' . str_pad(strlen($maInfo), 2, '0', STR_PAD_LEFT) . $maInfo;

    // Campo 52 — Categoria do comerciante (MCC)
    $payload .= '5204' . str_pad((string)$config->mcc, 4, '0', STR_PAD_RIGHT);

    // Campo 53 — Moeda (986 = BRL)
    $payload .= '5303986';

    // Campo 54 — Valor
    $valorStr = number_format((float)$valor, 2, '.', '');
    $payload .= '54' . str_pad(strlen($valorStr), 2, '0', STR_PAD_LEFT) . $valorStr;

    // Campo 58 — País (BR)
    $payload .= '5802BR';

    // Campo 59 — Nome do recebedor (máx. 25)
    $nome = mb_substr($config->nome_recebedor, 0, 25);
    $payload .= '59' . str_pad(strlen($nome), 2, '0', STR_PAD_LEFT) . $nome;

    // Campo 60 — Cidade (máx. 15)
    $cidade = mb_substr($config->cidade, 0, 15);
    $payload .= '60' . str_pad(strlen($cidade), 2, '0', STR_PAD_LEFT) . $cidade;

    // Campo 62 — Dados adicionais (subcampo 05 = txid)
    $txid = $config->txid ?: '***';
    $txidField = '05' . str_pad(strlen($txid), 2, '0', STR_PAD_LEFT) . $txid;
    $payload .= '62' . str_pad(strlen($txidField), 2, '0', STR_PAD_LEFT) . $txidField;

    // Campo 63 — CRC16
    $payload .= '6304' . calcularCrc16($payload . '6304');

    return $payload;
}







// --- ROTAS PÚBLICAS DE AUTENTICAÇÃO ---
// Endpoint de login (Usado tanto por Amanda & Lucas quanto pelos convidados)
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
    Route::get('/me', function (Request $request) {
        return response()->json([
            'usuario' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'username' => $request->user()->username,
                'email' => $request->user()->email,
                'role' => $request->user()->role,
            ]
        ]);
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

    Route::get('/presentes', function (Request $request) {
        $presentes = App\Models\Presente::with('comprador:id,name')->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'nome' => $p->nome,
                'descricao' => $p->descricao,
                'valor_estimado' => (float)$p->valor_estimado,
                'valor_formatado' => 'R$ ' . number_format($p->valor_estimado, 2, ',', '.'),
                'imagem_url' => $p->imagem_url,
                'reservado' => !is_null($p->user_id),
                'reservado_por_mim' => $p->user_id === auth()->id(),
                'recebido' => (bool)$p->recebido,
                'comprador' => $p->comprador ? $p->comprador->name : null,
            ];
        });

        // Mensagens enviadas pelos noivos ao convidado logado
        $mensagens = App\Models\Mensagem::where('destinatario_id', $request->user()->id)
            ->with('presente:id,nome')
            ->orderByDesc('created_at')
            ->get();

        // Marca como lidas as mensagens recém-buscadas
        App\Models\Mensagem::where('destinatario_id', $request->user()->id)
            ->where('lida', false)
            ->update(['lida' => true]);

        return response()->json([
            'presentes' => $presentes,
            'mensagens' => $mensagens->map(fn ($m) => [
                'id' => $m->id,
                'presente' => $m->presente ? $m->presente->nome : null,
                'mensagem' => $m->mensagem,
                'criado_em' => $m->created_at ? $m->created_at->format('d/m/Y \à\s H:i') : null,
            ]),
        ]);
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

        $pixConfig = App\Models\PixConfig::first();
        if (!$pixConfig) {
            return response()->json([
                'status' => 'erro',
                'mensagem' => 'O PIX ainda não foi configurado pelos noivos. Tente novamente mais tarde.'
            ], 422);
        }

        $valorFormatado = 'R$ ' . number_format($presente->valor_estimado, 2, ',', '.');
        $pixPayload = gerarPayloadPix($pixConfig, $presente->valor_estimado);

        return response()->json([
            'status' => 'sucesso',
            'mensagem' => 'Presente reservado com sucesso!',
            'presente' => [
                'id' => $presente->id,
                'nome' => $presente->nome,
                'valor' => $valorFormatado,
            ],
            'pix' => [
                'chave' => $pixConfig->chave_pix,
                'payload' => $pixPayload,
            ]
        ]);
    });

    Route::get('/local', function () {
        $tipo = request()->query('tipo');

        $query = App\Models\Local::query();

        if ($tipo && in_array($tipo, ['CERIMONIA', 'RECEPCAO'])) {
            $query->where('tipo', $tipo);
            $local = $query->first();

            if (!$local) {
                return response()->json([
                    'tipo' => null,
                    'horario' => null,
                    'nome' => null,
                    'endereco' => null,
                    'cidade_uf' => null,
                    'mapa_iframe' => null,
                ]);
            }

            return response()->json([
                'tipo' => $local->tipo,
                'horario' => $local->horario,
                'nome' => $local->nome,
                'endereco' => $local->endereco,
                'cidade_uf' => $local->cidade_uf,
                'mapa_iframe' => $local->mapa_iframe,
            ]);
        }

        $locais = $query->get()->map(fn ($l) => [
            'tipo' => $l->tipo,
            'horario' => $l->horario,
            'nome' => $l->nome,
            'endereco' => $l->endereco,
            'cidade_uf' => $l->cidade_uf,
            'mapa_iframe' => $l->mapa_iframe,
        ]);

        return response()->json($locais);
    });
});

// --- ROTAS EXCLUSIVAS DOS NOIVOS ---
// Além de estar logado, o usuário PRECISA ter a role 'noivos'
Route::middleware(['auth:sanctum', 'noivos'])->group(function () {
    
    // Rota administrativa: apenas os noivos podem cadastrar novos convidados ou novos usuários
    Route::post('/usuarios/cadastrar', [AuthController::class, 'register']);

    // Salva a configuração PIX informada pelos noivos (linha única)
    Route::put('/pix-config', function (Request $request) {
        $validated = $request->validate([
            'chave_pix' => ['required', 'string', 'max:255'],
            'nome_recebedor' => ['required', 'string', 'max:25'],
            'cidade' => ['required', 'string', 'max:15'],
            'mcc' => ['nullable', 'string', 'max:4'],
            'txid' => ['nullable', 'string', 'max:25'],
        ]);

        $config = App\Models\PixConfig::first();
        if (!$config) {
            $config = new App\Models\PixConfig();
        }

        $config->chave_pix = trim($validated['chave_pix']);
        $config->nome_recebedor = trim($validated['nome_recebedor']);
        $config->cidade = trim($validated['cidade']);
        $config->mcc = $validated['mcc'] ?? '0000';
        $config->txid = $validated['txid'] ?? '***';
        $config->save();

        return response()->json([
            'status' => 'sucesso',
            'mensagem' => 'Configuração PIX salva com sucesso!',
        ]);
    });

    // Lista todos os convidados cadastrados com status de presença e presentes reservados
    Route::get('/painel-noivos/convidados', function () {
        $convidados = App\Models\User::where('role', 'convidado')
            ->with('presenca')
            ->withCount('presentes')
            ->orderBy('name')
            ->get();

        return response()->json($convidados->map(fn ($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'username' => $u->username,
            'email' => $u->email,
            'presenca' => $u->presenca ? [
                'confirmado' => (bool)$u->presenca->confirmado,
                'acompanhantes' => (int)$u->presenca->acompanhantes,
                'observacoes' => $u->presenca->observacoes,
            ] : null,
            'total_presentes' => (int)$u->presentes_count,
        ]));
    });

    // Atualiza os dados de um convidado (nome, usuário, senha e função)
    Route::put('/convidados/{convidado}', function (Request $request, App\Models\User $convidado) {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', \Illuminate\Validation\Rule::unique('users', 'username')->ignore($convidado->id)],
            'password' => ['nullable', 'string', 'min:6'],
            'role' => ['string', 'in:convidado,noivos'],
        ]);

        $convidado->name = trim($data['name']);
        $convidado->username = trim($data['username']);
        if (!empty($data['password'])) {
            $convidado->password = Illuminate\Support\Facades\Hash::make($data['password']);
        }
        $convidado->role = $data['role'] ?? $convidado->role;
        $convidado->save();

        return response()->json([
            'status' => 'sucesso',
            'mensagem' => 'Convidado atualizado com sucesso!',
            'convidado' => [
                'id' => $convidado->id,
                'name' => $convidado->name,
                'username' => $convidado->username,
                'role' => $convidado->role,
            ],
        ]);
    });

    // Remove um convidado (presenças vinculadas são excluídas e presentes liberados)
    Route::delete('/convidados/{convidado}', function (App\Models\User $convidado) {
        if ($convidado->role !== 'convidado') {
            return response()->json([
                'status' => 'erro',
                'mensagem' => 'Não é possível remover usuários administrativos.'
            ], 422);
        }

        $convidado->delete();

        return response()->json([
            'status' => 'sucesso',
            'mensagem' => 'Convidado removido com sucesso!',
        ]);
    });

    // Endpoint para os noivos visualizarem os relatórios em tempo real no Dashboard
    Route::get('/painel-noivos/resumo', function (Request $request) {
        $confirmados = App\Models\Presenca::where('confirmado', true)->with('user:id,name')->get();
        $naoConfirmados = App\Models\Presenca::where('confirmado', false)->count();
        $totalConvidados = App\Models\User::where('role', 'convidado')->count();

        $presentesGanhos = App\Models\Presente::whereNotNull('user_id')->get();
        $totalPresentes = App\Models\Presente::count();

        return response()->json([
            'usuario' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'username' => $request->user()->username,
                'email' => $request->user()->email,
                'role' => $request->user()->role,
            ],
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

    // Lista todos os presentes cadastrados para gestão dos noivos
    Route::get('/painel-noivos/presentes', function () {
        $presentes = App\Models\Presente::with(['comprador:id,name', 'mensagens'])
            ->orderByRaw('CASE WHEN user_id IS NULL THEN 0 ELSE 1 END')
            ->orderByDesc('updated_at')
            ->get();

        $pixConfig = App\Models\PixConfig::first();

        return response()->json([
            'presentes' => $presentes->map(fn ($p) => [
                'id' => $p->id,
                'nome' => $p->nome,
                'descricao' => $p->descricao,
                'valor_estimado' => (float)$p->valor_estimado,
                'valor_formatado' => 'R$ ' . number_format($p->valor_estimado, 2, ',', '.'),
                'imagem_url' => $p->imagem_url,
                'reservado' => !is_null($p->user_id),
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
            ]),
            'pix_config' => $pixConfig ? $pixConfig->only([
                'chave_pix',
                'nome_recebedor',
                'cidade',
                'mcc',
                'txid',
            ]) : [
                'chave_pix' => '',
                'nome_recebedor' => '',
                'cidade' => '',
                'mcc' => '0000',
                'txid' => '***',
            ],
        ]);
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
            'imagem_url' => ['nullable', 'string', 'max:2048'],
        ]);

        $presente = App\Models\Presente::create([
            'nome' => trim($validated['nome']),
            'descricao' => $validated['descricao'] ?? null,
            'valor_estimado' => $validated['valor_estimado'] ?? null,
            'imagem_url' => $validated['imagem_url'] ?? null,
        ]);

        return response()->json([
            'status' => 'sucesso',
            'mensagem' => 'Presente adicionado com sucesso!',
            'presente' => [
                'id' => $presente->id,
                'nome' => $presente->nome,
                'valor_formatado' => $presente->valor_estimado ? 'R$ ' . number_format($presente->valor_estimado, 2, ',', '.') : null,
                'imagem_url' => $presente->imagem_url,
            ],
        ], 201);
    });

    // Duplica um presente existente sem vincular convidado
    Route::post('/presentes/{presente}/duplicar', function (App\Models\Presente $presente) {
        $novo = App\Models\Presente::create([
            'nome' => $presente->nome . ' (cópia)',
            'descricao' => $presente->descricao,
            'valor_estimado' => $presente->valor_estimado,
            'imagem_url' => $presente->imagem_url,
        ]);

        return response()->json([
            'status' => 'sucesso',
            'mensagem' => 'Presente duplicado com sucesso!',
            'presente' => [
                'id' => $novo->id,
                'nome' => $novo->nome,
                'valor_formatado' => $novo->valor_estimado ? 'R$ ' . number_format($novo->valor_estimado, 2, ',', '.') : null,
            ],
        ], 201);
    });

    // Atualiza os dados de um presente existente pelos noivos
    Route::put('/presentes/{presente}', function (Request $request, App\Models\Presente $presente) {
        $validated = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string', 'max:500'],
            'valor_estimado' => ['nullable', 'numeric', 'min:0'],
            'imagem_url' => ['nullable', 'string', 'max:2048'],
        ]);

        $presente->update([
            'nome' => trim($validated['nome']),
            'descricao' => $validated['descricao'] ?? null,
            'valor_estimado' => $validated['valor_estimado'] ?? null,
            'imagem_url' => $validated['imagem_url'] ?? null,
        ]);

        return response()->json([
            'status' => 'sucesso',
            'mensagem' => 'Presente atualizado com sucesso!',
            'presente' => $presente->only(['id', 'nome', 'descricao', 'valor_estimado', 'imagem_url']),
        ]);
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


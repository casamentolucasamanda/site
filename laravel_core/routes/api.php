<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Artisan;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');




// --- ROTAS PÚBLICAS DE AUTENTICAÇÃO ---
// Endpoint de login (Usado tanto por Lucas & Amanda quanto pelos convidados)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);

// --- ROTAS PROTEGIDAS PELO SANCTUM ---
// Qualquer usuário logado (noivos ou convidados) consegue acessar este grupo
Route::middleware('auth:sanctum')->group(function () {
    
    // Apenas os noivos podem cadastrar novos convidados ou novos usuários
    Route::post('/usuarios/cadastrar', [AuthController::class, 'register']);
    
    Route::get('/painel-noivos/resumo', function () {
        // Lógica do painel de controle...
    });
    
    // Retorna os dados do usuário atual (Útil para a SPA checar se ainda está logado)
    Route::get('/user', [AuthController::class, 'user']);
    
    // Endpoints para ações dos convidados
    Route::post('/confirmar-presenca', function () {
        return response()->json(['mensagem' => 'Lógica de salvar presença vai aqui']);
    });
    
    Route::post('/escolher-presente', function () {
        return response()->json(['mensagem' => 'Lógica de reservar presente vai aqui']);
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


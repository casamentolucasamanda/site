<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids; // Importa a trait de UUID
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Presente extends Model
{
    use HasUuids; // Ativa o UUID para este modelo

    protected $fillable = [
        'nome',
        'descricao',
        'valor_estimado',
        'user_id',
        'recebido'
    ];

    protected $casts = [
        'recebido' => 'boolean',
    ];

    public function comprador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function mensagens(): HasMany
    {
        return $this->hasMany(Mensagem::class);
    }
}

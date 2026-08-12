<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids; // Importa a trait de UUID
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Presenca extends Model
{
    use HasUuids; // Ativa o UUID para este modelo

    protected $fillable = [
        'user_id',
        'acompanhantes',
        'confirmado',
        'observacoes'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

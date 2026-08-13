<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mensagem extends Model
{
    use HasUuids;

    protected $table = 'mensagens';

    protected $fillable = [
        'presente_id',
        'remetente_id',
        'destinatario_id',
        'mensagem',
        'lida'
    ];

    protected $casts = [
        'lida' => 'boolean',
    ];

    public function presente(): BelongsTo
    {
        return $this->belongsTo(Presente::class);
    }

    public function remetente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'remetente_id');
    }

    public function destinatario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'destinatario_id');
    }
}

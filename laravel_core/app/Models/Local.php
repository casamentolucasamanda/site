<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Local extends Model
{
    use HasUuids;

    protected $table = 'locais';

    protected $fillable = [
        'tipo',
        'horario',
        'nome',
        'endereco',
        'cidade_uf',
        'mapa_iframe',
    ];
}

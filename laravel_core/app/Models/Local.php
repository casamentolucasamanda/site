<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Local extends Model
{
    use HasUuids;

    protected $fillable = [
        'nome',
        'endereco',
        'cidade_uf',
        'mapa_iframe',
    ];
}

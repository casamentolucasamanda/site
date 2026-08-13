<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PixConfig extends Model
{
    use HasUuids;

    protected $table = 'pix_configs';

    protected $fillable = [
        'chave_pix',
        'nome_recebedor',
        'cidade',
        'mcc',
        'txid',
    ];
}

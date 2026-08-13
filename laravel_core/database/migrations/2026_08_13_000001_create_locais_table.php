<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locais', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nome');
            $table->string('endereco')->nullable();
            $table->string('cidade_uf')->nullable();
            $table->text('mapa_iframe')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('locais');
    }
};

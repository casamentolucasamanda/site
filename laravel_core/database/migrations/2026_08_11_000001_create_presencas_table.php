<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presencas', function (Blueprint $table) {
            $table->uuid('id')->primary(); // Chave primária UUID
            // Vincula ao UUID da tabela users
            $table->foreignUuid('user_id')->constrained()->onDelete('cascade');
            $table->integer('acompanhantes')->default(0);
            $table->boolean('confirmado')->default(true);
            $table->text('observacoes')->nullable(); 
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('presencas');
    }
};

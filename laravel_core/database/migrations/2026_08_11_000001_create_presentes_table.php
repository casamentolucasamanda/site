<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presentes', function (Blueprint $table) {
            $table->uuid('id')->primary(); // Chave primária UUID
            $table->string('nome');
            $table->text('descricao')->nullable();
            $table->decimal('valor_estimado', 10, 2)->nullable();
            $table->text('imagem_url')->nullable();
            // Declara o relacionamento com UUID permitindo nulo
            $table->foreignUuid('user_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('presentes');
    }
};

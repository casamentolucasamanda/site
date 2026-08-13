<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mensagens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('presente_id')->nullable()->constrained('presentes')->cascadeOnDelete();
            $table->foreignUuid('remetente_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('destinatario_id')->constrained('users')->cascadeOnDelete();
            $table->text('mensagem');
            $table->boolean('lida')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mensagens');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * many-to-many antara `users` (kontak) dan klien ERP — 1 orang (1 email/1
 * login) bisa terhubung ke LEBIH DARI 1 erp_client_id (mis. pengawas PT A
 * yang juga punya proyek pribadi terpisah). Backfill dari kolom lama
 * users.erp_client_id ada di migration berikutnya sebelum kolom itu dihapus.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('erp_client_id');
            $table->string('erp_client_name')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'erp_client_id']);
            $table->index('erp_client_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_links');
    }
};

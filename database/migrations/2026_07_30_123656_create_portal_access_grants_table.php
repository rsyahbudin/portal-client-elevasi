<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Simpan token Sanctum yang diterbitkan ERP per-Client (Portal -> ERP, baca
 * data). Satu baris per erp_client_id. `erp_api_token` dienkripsi at-rest.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('portal_access_grants', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('erp_client_id')->unique();
            $table->text('erp_api_token');
            $table->string('status')->default('active'); // active|revoked
            $table->timestamp('granted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('portal_access_grants');
    }
};

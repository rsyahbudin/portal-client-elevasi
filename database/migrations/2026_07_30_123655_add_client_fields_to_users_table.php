<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `users` di app ini = kontak klien (client_users secara konsep) — bukan
 * staf internal. `erp_client_id` cuma integer polos, TIDAK ada foreign key
 * lintas database ke ERP (DB terpisah sepenuhnya, lihat plan portal client).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('erp_client_id')->after('id');
            $table->string('erp_client_name')->nullable()->after('erp_client_id');
            $table->boolean('is_active')->default(true)->after('password');
            $table->timestamp('invited_at')->nullable()->after('is_active');
            $table->timestamp('last_login_at')->nullable()->after('invited_at');

            $table->index('erp_client_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['erp_client_id', 'erp_client_name', 'is_active', 'invited_at', 'last_login_at']);
        });
    }
};

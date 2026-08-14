<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Backfill users.erp_client_id/erp_client_name lama ke client_links, baru
 * hapus kolomnya — akses per user sekarang murni ditentukan lewat
 * client_links (many-to-many), bukan kolom tunggal ini lagi.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereNotNull('erp_client_id')
            ->orderBy('id')
            ->chunk(200, function ($users) {
                $rows = $users->map(fn ($u) => [
                    'user_id' => $u->id,
                    'erp_client_id' => $u->erp_client_id,
                    'erp_client_name' => $u->erp_client_name,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])->all();

                if ($rows !== []) {
                    DB::table('client_links')->insertOrIgnore($rows);
                }
            });

        Schema::table('users', function (Blueprint $table) {
            // SQLite (dipakai testing) tidak bisa dropColumn kolom yang masih
            // ada index-nya — drop index-nya dulu secara eksplisit. Aman di
            // Postgres juga (index otomatis ikut hilang saat dropColumn di
            // sana, tapi drop eksplisit dulu tidak masalah).
            $table->dropIndex(['erp_client_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['erp_client_id', 'erp_client_name']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('erp_client_id')->nullable()->after('id');
            $table->string('erp_client_name')->nullable()->after('erp_client_id');
        });

        // Ambil client link pertama per user sebagai fallback (data historis
        // tidak sepenuhnya bisa direkonstruksi kalau user sudah multi-client).
        DB::table('client_links')
            ->select('user_id', DB::raw('MIN(erp_client_id) as erp_client_id'))
            ->groupBy('user_id')
            ->orderBy('user_id')
            ->get()
            ->each(function ($row) {
                $link = DB::table('client_links')
                    ->where('user_id', $row->user_id)
                    ->where('erp_client_id', $row->erp_client_id)
                    ->first();

                DB::table('users')->where('id', $row->user_id)->update([
                    'erp_client_id' => $row->erp_client_id,
                    'erp_client_name' => $link->erp_client_name ?? null,
                ]);
            });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            if (!Schema::hasColumn('branches', 'email')) {
                $table->string('email', 255)->nullable()->after('address');
            }
            if (!Schema::hasColumn('branches', 'phone')) {
                $table->string('phone', 30)->nullable()->after('email');
            }
            if (!Schema::hasColumn('branches', 'working_days')) {
                $table->string('working_days', 255)->nullable()->after('shift_end');
            }
        });

        // manager_id must match users.id which is int(11) signed — drop any
        // wrongly-typed column left by a previous attempt, then add it correctly.
        if (Schema::hasColumn('branches', 'manager_id')) {
            Schema::table('branches', function (Blueprint $table) {
                $table->dropColumn('manager_id');
            });
        }
        Schema::table('branches', function (Blueprint $table) {
            $table->integer('manager_id')->nullable()->after('working_days');
            $table->foreign('manager_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('branches', function (Blueprint $table) {
            if (!Schema::hasColumn('branches', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }
            if (!Schema::hasColumn('branches', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropForeign(['manager_id']);
            $table->dropColumn(['email', 'phone', 'working_days', 'manager_id', 'created_at', 'updated_at']);
        });
    }
};

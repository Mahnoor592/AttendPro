<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shift_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('shift_requests', 'start_date')) {
                $table->date('start_date')->nullable()->after('employee_id');
            }
            if (!Schema::hasColumn('shift_requests', 'end_date')) {
                $table->date('end_date')->nullable()->after('start_date');
            }
        });

        // time-off requests are date-based, so a linked schedule is optional now
        Schema::table('shift_requests', function (Blueprint $table) {
            $table->integer('schedule_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('shift_requests', function (Blueprint $table) {
            $table->dropColumn(['start_date', 'end_date']);
        });
    }
};

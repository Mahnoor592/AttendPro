<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('attendance_logs')) {
            return;
        }

        Schema::create('attendance_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['check_in', 'check_out']);
            $table->decimal('gps_lat', 10, 8)->nullable();
            $table->decimal('gps_lng', 11, 8)->nullable();
            $table->string('readable_address', 255)->nullable();
            $table->dateTime('timestamp');
            $table->boolean('is_valid')->default(true);
            $table->enum('flag', ['on_time', 'late', 'early_departure'])->nullable();
            $table->decimal('working_hours', 4, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_logs');
    }
};

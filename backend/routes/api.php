<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\ShiftRequestController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SettingsController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateProfile']);
    Route::put('/me/password', [AuthController::class, 'updatePassword']);
    Route::delete('/me', [AuthController::class, 'destroyAccount']);

    // Admin only
    Route::middleware('role:admin')->group(function () {
        Route::post('employees', [EmployeeController::class, 'store']);
        Route::put('employees/{id}', [EmployeeController::class, 'update']);
        Route::delete('employees/{id}', [EmployeeController::class, 'destroy']);
        Route::post('branches', [BranchController::class, 'store']);
        Route::put('branches/{id}', [BranchController::class, 'update']);
        Route::put('branches/{id}/image', [BranchController::class, 'updateImage']);
        Route::delete('branches/{id}', [BranchController::class, 'destroy']);
        Route::put('settings', [SettingsController::class, 'update']);
    });

    // Admin only (shared with employee-facing reads)
    Route::middleware('role:admin')->group(function () {
        Route::get('employees', [EmployeeController::class, 'index']);
        Route::get('employees/{id}', [EmployeeController::class, 'show']);
        Route::get('branches', [BranchController::class, 'index']);
        Route::get('branches/{id}', [BranchController::class, 'show']);
        Route::get('dashboard', [DashboardController::class, 'index']);
        Route::get('settings', [SettingsController::class, 'index']);
        Route::apiResource('schedules', ScheduleController::class);
        Route::get('attendance/anomalies', [AttendanceController::class, 'anomalies']);
        Route::get('attendance', [AttendanceController::class, 'index']);
        Route::get('shift-requests', [ShiftRequestController::class, 'index']);
        Route::put('shift-requests/{id}', [ShiftRequestController::class, 'decide']);
    });

    // Employee only
    Route::middleware('role:employee')->group(function () {
        Route::post('attendance/checkin', [AttendanceController::class, 'checkIn']);
        Route::post('attendance/checkout', [AttendanceController::class, 'checkOut']);
        Route::get('attendance/mine', [AttendanceController::class, 'mine']);
        Route::get('schedule/mine', [ScheduleController::class, 'mine']);
        Route::post('shift-requests', [ShiftRequestController::class, 'store']);
        Route::get('shift-requests/mine', [ShiftRequestController::class, 'mine']);
    });
});

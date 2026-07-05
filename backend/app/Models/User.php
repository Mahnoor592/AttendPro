<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    public $timestamps = false;

    protected $rememberTokenName = null;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'position',
        'avatar',
        'password',
        'role',
        'branch_id',
        'is_active',
    ];

    protected $hidden = ['password'];

    protected function casts(): array
    {
        return [
            'password'  => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class, 'employee_id');
    }

    public function attendanceLogs()
    {
        return $this->hasMany(AttendanceLog::class, 'employee_id');
    }

    public function shiftRequests()
    {
        return $this->hasMany(ShiftRequest::class, 'employee_id');
    }
}

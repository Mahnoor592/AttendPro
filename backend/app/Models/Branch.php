<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $fillable = [
        'name',
        'address',
        'image',
        'email',
        'phone',
        'lat',
        'lng',
        'radius_meters',
        'shift_start',
        'shift_end',
        'working_days',
        'manager_id',
    ];

    protected function casts(): array
    {
        return [
            'lat'           => 'float',
            'lng'           => 'float',
            'radius_meters' => 'integer',
        ];
    }

    public function employees()
    {
        return $this->hasMany(User::class);
    }

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function attendanceLogs()
    {
        return $this->hasMany(AttendanceLog::class);
    }
}

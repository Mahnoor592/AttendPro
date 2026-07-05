<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'employee_id',
        'branch_id',
        'type',
        'gps_lat',
        'gps_lng',
        'readable_address',
        'timestamp',
        'is_valid',
        'flag',
        'working_hours',
    ];

    protected function casts(): array
    {
        return [
            'is_valid'      => 'boolean',
            'gps_lat'       => 'float',
            'gps_lng'       => 'float',
            'working_hours' => 'float',
            'timestamp'     => 'datetime',
        ];
    }

    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}

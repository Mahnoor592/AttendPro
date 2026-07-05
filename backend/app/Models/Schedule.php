<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'employee_id',
        'branch_id',
        'day_of_week',
        'shift_start',
        'shift_end',
        'week_start_date',
    ];

    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function shiftRequests()
    {
        return $this->hasMany(ShiftRequest::class);
    }
}

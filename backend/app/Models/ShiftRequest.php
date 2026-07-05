<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftRequest extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'employee_id',
        'schedule_id',
        'start_date',
        'end_date',
        'reason',
        'status',
        'reviewed_by',
        'reviewed_at',
        'response_note',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
            'start_date'  => 'date',
            'end_date'    => 'date',
        ];
    }

    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}

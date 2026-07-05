<x-mail::message>
# Shift Request {{ ucfirst($shiftRequest->status) }}

Hello {{ $shiftRequest->employee->name }},

Your shift change request has been **{{ $shiftRequest->status }}**.

<x-mail::panel>
**Shift:** {{ $shiftRequest->schedule->day_of_week }}, {{ $shiftRequest->schedule->shift_start }} – {{ $shiftRequest->schedule->shift_end }}
**Branch:** {{ $shiftRequest->schedule->branch->name }}
@if($shiftRequest->response_note)
**Note from HR:** {{ $shiftRequest->response_note }}
@endif
</x-mail::panel>

Please log in to the attendance system to view your updated schedule.

Thanks,
{{ config('app.name') }}
</x-mail::message>

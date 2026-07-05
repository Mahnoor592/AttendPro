<x-mail::message>
# New Shift Change Request

A shift change request has been submitted and requires your review.

<x-mail::panel>
**Employee:** {{ $shiftRequest->employee->name }}
**Shift:** {{ $shiftRequest->schedule->day_of_week }}, {{ $shiftRequest->schedule->shift_start }} – {{ $shiftRequest->schedule->shift_end }}
**Branch:** {{ $shiftRequest->schedule->branch->name }}
**Reason:** {{ $shiftRequest->reason }}
</x-mail::panel>

Please log in to the HR panel to approve or deny this request.

Thanks,
{{ config('app.name') }}
</x-mail::message>

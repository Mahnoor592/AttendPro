<x-mail::message>
# Shift Updated

Hello {{ $schedule->employee->name }},

Your shift has been updated. Here are the new details:

<x-mail::panel>
**Branch:** {{ $schedule->branch->name }}
**Day:** {{ $schedule->day_of_week }}
**Time:** {{ $schedule->shift_start }} – {{ $schedule->shift_end }}
**Week Starting:** {{ $schedule->week_start_date }}
</x-mail::panel>

Please log in to the attendance system to view your full schedule.

Thanks,
{{ config('app.name') }}
</x-mail::message>

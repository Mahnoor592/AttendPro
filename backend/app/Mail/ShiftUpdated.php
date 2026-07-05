<?php

namespace App\Mail;

use App\Models\Schedule;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class ShiftUpdated extends Mailable
{
    public function __construct(public Schedule $schedule) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your Shift Has Been Updated');
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.shift_updated');
    }
}

<?php

namespace App\Mail;

use App\Models\ShiftRequest;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class ShiftRequestSubmitted extends Mailable
{
    public function __construct(public ShiftRequest $shiftRequest) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'New Shift Change Request');
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.shift_request_submitted');
    }
}

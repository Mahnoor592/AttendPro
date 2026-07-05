<?php

namespace App\Mail;

use App\Models\ShiftRequest;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class ShiftRequestDecision extends Mailable
{
    public function __construct(public ShiftRequest $shiftRequest) {}

    public function envelope(): Envelope
    {
        $status = ucfirst($this->shiftRequest->status);

        return new Envelope(subject: "Your Shift Request Has Been {$status}");
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.shift_request_decision');
    }
}

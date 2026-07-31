<?php

namespace App\Exceptions\Booking;

class NoCreditsRemainingException extends BookingException
{
    protected $message = 'You have no remaining class credits on your membership.';
}

<?php

namespace App\Exceptions\Booking;

class DuplicateBookingException extends BookingException
{
    protected $message = 'You already have an active booking for this class.';
}

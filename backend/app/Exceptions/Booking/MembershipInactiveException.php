<?php

namespace App\Exceptions\Booking;

class MembershipInactiveException extends BookingException
{
    protected $message = 'You need an active membership to book a class.';
}

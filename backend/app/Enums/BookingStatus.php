<?php

namespace App\Enums;

enum BookingStatus: string
{
    case Booked = 'booked';
    case Waitlisted = 'waitlisted';
    case Cancelled = 'cancelled';
    case Attended = 'attended';
}

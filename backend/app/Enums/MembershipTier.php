<?php

namespace App\Enums;

enum MembershipTier: string
{
    case PayPerClass = 'pay-per-class';
    case MonthlyUnlimited = 'monthly-unlimited';
    case Student = 'student';
}

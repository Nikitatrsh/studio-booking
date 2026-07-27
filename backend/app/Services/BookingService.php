<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\MembershipStatus;
use App\Enums\MembershipTier;
use App\Exceptions\Booking\DuplicateBookingException;
use App\Exceptions\Booking\MembershipInactiveException;
use App\Exceptions\Booking\NoCreditsRemainingException;
use App\Models\Booking;
use App\Models\Membership;
use App\Models\StudioClass;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class BookingService
{
    public function book(User $user, StudioClass $studioClass): Booking
    {
        return DB::transaction(function () use ($user, $studioClass) {
            $studioClass = StudioClass::whereKey($studioClass->id)->lockForUpdate()->firstOrFail();

            $this->assertNotAlreadyBooked($user, $studioClass);

            $membership = $this->requireActiveMembership($user);

            if (! $membership->hasCreditsRemaining()) {
                throw new NoCreditsRemainingException;
            }

            $status = $studioClass->hasAvailableSpot() ? BookingStatus::Booked : BookingStatus::Waitlisted;

            $booking = Booking::create([
                'user_id' => $user->id,
                'studio_class_id' => $studioClass->id,
                'status' => $status,
                'booked_at' => now(),
            ]);

            if ($status === BookingStatus::Booked) {
                $this->consumeCreditIfNeeded($membership);
            }

            return $booking;
        });
    }

    public function cancel(Booking $booking): Booking
    {
        return DB::transaction(function () use ($booking) {
            $booking = Booking::whereKey($booking->id)->lockForUpdate()->firstOrFail();
            $wasBooked = $booking->status === BookingStatus::Booked;

            $booking->update(['status' => BookingStatus::Cancelled]);

            if ($wasBooked) {
                $this->promoteNextWaitlisted($booking->studio_class_id);
            }

            return $booking->fresh();
        });
    }

    private function promoteNextWaitlisted(int $studioClassId): void
    {
        $next = Booking::where('studio_class_id', $studioClassId)
            ->where('status', BookingStatus::Waitlisted)
            ->orderBy('booked_at')
            ->lockForUpdate()
            ->first();

        if (! $next) {
            return;
        }

        $next->update(['status' => BookingStatus::Booked]);

        $membership = $this->findActiveMembership($next->user);

        if ($membership) {
            $this->consumeCreditIfNeeded($membership);
        }
    }

    private function assertNotAlreadyBooked(User $user, StudioClass $studioClass): void
    {
        $exists = Booking::where('user_id', $user->id)
            ->where('studio_class_id', $studioClass->id)
            ->whereIn('status', [BookingStatus::Booked, BookingStatus::Waitlisted])
            ->exists();

        if ($exists) {
            throw new DuplicateBookingException;
        }
    }

    private function findActiveMembership(User $user): ?Membership
    {
        return $user->memberships()
            ->where('status', MembershipStatus::Active)
            ->get()
            ->first(fn (Membership $membership) => $membership->isActive());
    }

    private function requireActiveMembership(User $user): Membership
    {
        return $this->findActiveMembership($user) ?? throw new MembershipInactiveException;
    }

    private function consumeCreditIfNeeded(Membership $membership): void
    {
        if ($membership->tier === MembershipTier::PayPerClass && $membership->credits_remaining > 0) {
            $membership->decrement('credits_remaining');
        }
    }
}

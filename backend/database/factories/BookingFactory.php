<?php

namespace Database\Factories;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\StudioClass;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'studio_class_id' => StudioClass::factory(),
            'status' => BookingStatus::Booked,
            'booked_at' => now(),
        ];
    }

    public function waitlisted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => BookingStatus::Waitlisted,
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => BookingStatus::Cancelled,
        ]);
    }
}

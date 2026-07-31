<?php

namespace Database\Factories;

use App\Enums\MembershipStatus;
use App\Enums\MembershipTier;
use App\Models\Membership;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Membership>
 */
class MembershipFactory extends Factory
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
            'tier' => MembershipTier::MonthlyUnlimited,
            'status' => MembershipStatus::Active,
            'start_date' => now()->subMonth(),
            'end_date' => now()->addMonth(),
            'credits_remaining' => null,
        ];
    }

    public function payPerClass(int $credits = 10): static
    {
        return $this->state(fn (array $attributes) => [
            'tier' => MembershipTier::PayPerClass,
            'credits_remaining' => $credits,
        ]);
    }

    public function student(): static
    {
        return $this->state(fn (array $attributes) => [
            'tier' => MembershipTier::Student,
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => MembershipStatus::Expired,
            'start_date' => now()->subMonths(2),
            'end_date' => now()->subMonth(),
        ]);
    }
}

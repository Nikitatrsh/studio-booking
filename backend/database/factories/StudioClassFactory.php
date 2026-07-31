<?php

namespace Database\Factories;

use App\Enums\DayOfWeek;
use App\Models\StudioClass;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudioClass>
 */
class StudioClassFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Vinyasa Flow', 'HIIT Circuit', 'Spin', 'Pilates', 'Boxing Fundamentals']),
            'instructor_id' => User::factory()->instructor(),
            'capacity' => 10,
            'day_of_week' => fake()->randomElement(DayOfWeek::cases()),
            'start_time' => '18:00:00',
            'duration' => 60,
            'is_recurring' => true,
        ];
    }
}

<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Membership;
use App\Models\StudioClass;
use App\Models\User;
use App\Services\BookingService;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed a small but realistic dataset covering every role and the
     * expired-membership / no-credits / waitlist edge cases, so the
     * frontend has something meaningful to render out of the box.
     */
    public function run(): void
    {
        $admin = User::factory()->create([
            'name' => 'Amy Admin',
            'email' => 'admin@example.com',
            'password' => 'password',
            'role' => UserRole::Admin,
        ]);

        $ivy = User::factory()->create([
            'name' => 'Ivy Instructor',
            'email' => 'ivy@example.com',
            'password' => 'password',
            'role' => UserRole::Instructor,
        ]);

        $sam = User::factory()->create([
            'name' => 'Sam Instructor',
            'email' => 'sam@example.com',
            'password' => 'password',
            'role' => UserRole::Instructor,
        ]);

        $mia = User::factory()->create([
            'name' => 'Mia Member',
            'email' => 'mia@example.com',
            'password' => 'password',
            'role' => UserRole::Member,
        ]);

        $max = User::factory()->create([
            'name' => 'Max Member',
            'email' => 'max@example.com',
            'password' => 'password',
            'role' => UserRole::Member,
        ]);

        $nora = User::factory()->create([
            'name' => 'Nora Newcomer',
            'email' => 'nora@example.com',
            'password' => 'password',
            'role' => UserRole::Member,
        ]);

        $eli = User::factory()->create([
            'name' => 'Eli Lapsed',
            'email' => 'eli@example.com',
            'password' => 'password',
            'role' => UserRole::Member,
        ]);

        $wendy = User::factory()->create([
            'name' => 'Wendy Waitlist',
            'email' => 'wendy@example.com',
            'password' => 'password',
            'role' => UserRole::Member,
        ]);

        $zack = User::factory()->create([
            'name' => 'Zack Waitlist',
            'email' => 'zack@example.com',
            'password' => 'password',
            'role' => UserRole::Member,
        ]);

        Membership::factory()->for($mia)->create();
        Membership::factory()->for($max)->payPerClass(3)->create();
        Membership::factory()->for($eli)->expired()->create();
        Membership::factory()->for($wendy)->create();
        Membership::factory()->for($zack)->create();
        // Nora is intentionally left without a membership

        $vinyasa = StudioClass::factory()->create([
            'name' => 'Vinyasa Flow',
            'instructor_id' => $ivy->id,
            'capacity' => 12,
            'day_of_week' => 'monday',
            'start_time' => '07:00',
            'duration' => 60,
        ]);

        $hiit = StudioClass::factory()->create([
            'name' => 'HIIT Circuit',
            'instructor_id' => $sam->id,
            'capacity' => 2,
            'day_of_week' => 'wednesday',
            'start_time' => '18:00',
            'duration' => 45,
        ]);

        $spin = StudioClass::factory()->create([
            'name' => 'Spin',
            'instructor_id' => $ivy->id,
            'capacity' => 15,
            'day_of_week' => 'friday',
            'start_time' => '06:00',
            'duration' => 45,
        ]);

        StudioClass::factory()->create([
            'name' => 'Pilates',
            'instructor_id' => $sam->id,
            'capacity' => 8,
            'day_of_week' => 'tuesday',
            'start_time' => '09:00',
            'duration' => 50,
        ]);

        $bookings = app(BookingService::class);

        $bookings->book($mia, $vinyasa);
        $bookings->book($mia, $spin);
        $bookings->book($max, $hiit);
        $bookings->book($wendy, $hiit); // fills HIIT Circuit to capacity
        $bookings->book($zack, $hiit); // lands on the waitlist
    }
}

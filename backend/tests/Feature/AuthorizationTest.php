<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\StudioClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_instructor_cannot_update_another_instructors_class(): void
    {
        $owner = User::factory()->instructor()->create();
        $otherInstructor = User::factory()->instructor()->create();
        $studioClass = StudioClass::factory()->create(['instructor_id' => $owner->id]);

        $response = $this->actingAs($otherInstructor)->putJson("/api/studio-classes/{$studioClass->id}", [
            'name' => 'Hijacked Class',
        ]);

        $response->assertForbidden();
    }

    public function test_instructor_can_update_their_own_class(): void
    {
        $instructor = User::factory()->instructor()->create();
        $studioClass = StudioClass::factory()->create(['instructor_id' => $instructor->id]);

        $response = $this->actingAs($instructor)->putJson("/api/studio-classes/{$studioClass->id}", [
            'name' => 'Updated Class Name',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('studio_classes', [
            'id' => $studioClass->id,
            'name' => 'Updated Class Name',
        ]);
    }

    public function test_member_cannot_view_another_members_booking(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $booking = Booking::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($other)->getJson("/api/bookings/{$booking->id}");

        $response->assertForbidden();
    }

    public function test_admin_can_manage_any_instructors_class(): void
    {
        $admin = User::factory()->admin()->create();
        $instructor = User::factory()->instructor()->create();
        $studioClass = StudioClass::factory()->create(['instructor_id' => $instructor->id]);

        $response = $this->actingAs($admin)->putJson("/api/studio-classes/{$studioClass->id}", [
            'name' => 'Admin Renamed Class',
        ]);

        $response->assertOk();
    }

    public function test_member_cannot_create_a_studio_class(): void
    {
        $member = User::factory()->create();

        $response = $this->actingAs($member)->postJson('/api/studio-classes', [
            'name' => 'Unauthorized Class',
            'capacity' => 10,
            'day_of_week' => 'monday',
            'start_time' => '09:00',
            'duration' => 60,
        ]);

        $response->assertForbidden();
    }

    public function test_instructor_can_see_bookings_for_their_own_class(): void
    {
        $instructor = User::factory()->instructor()->create();
        $studioClass = StudioClass::factory()->create(['instructor_id' => $instructor->id]);
        $booking = Booking::factory()->create(['studio_class_id' => $studioClass->id]);

        $response = $this->actingAs($instructor)->getJson('/api/bookings');

        $response->assertOk();
        $response->assertJsonFragment(['id' => $booking->id]);
    }

    public function test_instructor_cannot_see_bookings_for_someone_elses_class(): void
    {
        $instructor = User::factory()->instructor()->create();
        $otherClass = StudioClass::factory()->create();
        $booking = Booking::factory()->create(['studio_class_id' => $otherClass->id]);

        $response = $this->actingAs($instructor)->getJson('/api/bookings');

        $response->assertOk();
        $response->assertJsonMissing(['id' => $booking->id]);
    }
}

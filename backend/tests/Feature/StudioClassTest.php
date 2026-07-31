<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\StudioClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudioClassTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_includes_booked_and_waitlisted_counts(): void
    {
        $studioClass = StudioClass::factory()->create(['capacity' => 1]);
        Booking::factory()->create(['studio_class_id' => $studioClass->id]);
        Booking::factory()->waitlisted()->create(['studio_class_id' => $studioClass->id]);

        $response = $this->actingAs(User::factory()->create())->getJson('/api/studio-classes');

        $response->assertOk();
        $response->assertJsonFragment([
            'id' => $studioClass->id,
            'booked_count' => 1,
            'waitlisted_count' => 1,
        ]);
    }
}

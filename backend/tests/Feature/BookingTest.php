<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\Membership;
use App\Models\StudioClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_book_an_available_class(): void
    {
        $member = User::factory()->create();
        Membership::factory()->for($member)->create();
        $studioClass = StudioClass::factory()->create(['capacity' => 5]);

        $response = $this->actingAs($member)->postJson('/api/bookings', [
            'studio_class_id' => $studioClass->id,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('status', BookingStatus::Booked->value);

        $this->assertDatabaseHas('bookings', [
            'user_id' => $member->id,
            'studio_class_id' => $studioClass->id,
            'status' => BookingStatus::Booked->value,
        ]);
    }

    public function test_booking_at_capacity_puts_member_on_waitlist(): void
    {
        $studioClass = StudioClass::factory()->create(['capacity' => 1]);

        $firstMember = User::factory()->create();
        Membership::factory()->for($firstMember)->create();
        $this->actingAs($firstMember)
            ->postJson('/api/bookings', ['studio_class_id' => $studioClass->id])
            ->assertCreated();

        $secondMember = User::factory()->create();
        Membership::factory()->for($secondMember)->create();

        $response = $this->actingAs($secondMember)->postJson('/api/bookings', [
            'studio_class_id' => $studioClass->id,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('status', BookingStatus::Waitlisted->value);
    }

    public function test_booking_rejected_when_membership_expired(): void
    {
        $member = User::factory()->create();
        Membership::factory()->for($member)->expired()->create();
        $studioClass = StudioClass::factory()->create();

        $response = $this->actingAs($member)->postJson('/api/bookings', [
            'studio_class_id' => $studioClass->id,
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_booking_rejected_when_member_has_no_active_membership(): void
    {
        $member = User::factory()->create();
        $studioClass = StudioClass::factory()->create();

        $response = $this->actingAs($member)->postJson('/api/bookings', [
            'studio_class_id' => $studioClass->id,
        ]);

        $response->assertStatus(422);
    }

    public function test_cancelling_a_booking_promotes_the_first_waitlisted_member(): void
    {
        $studioClass = StudioClass::factory()->create(['capacity' => 1]);

        $bookedMember = User::factory()->create();
        Membership::factory()->for($bookedMember)->create();
        $bookedResponse = $this->actingAs($bookedMember)->postJson('/api/bookings', [
            'studio_class_id' => $studioClass->id,
        ]);
        $bookingId = $bookedResponse->json('id');

        $waitlistedMember = User::factory()->create();
        Membership::factory()->for($waitlistedMember)->create();
        $this->actingAs($waitlistedMember)
            ->postJson('/api/bookings', ['studio_class_id' => $studioClass->id])
            ->assertJsonPath('status', BookingStatus::Waitlisted->value);

        $this->actingAs($bookedMember)
            ->deleteJson("/api/bookings/{$bookingId}")
            ->assertOk();

        $this->assertDatabaseHas('bookings', [
            'user_id' => $waitlistedMember->id,
            'studio_class_id' => $studioClass->id,
            'status' => BookingStatus::Booked->value,
        ]);
    }

    public function test_member_cannot_double_book_the_same_class(): void
    {
        $member = User::factory()->create();
        Membership::factory()->for($member)->create();
        $studioClass = StudioClass::factory()->create();

        $this->actingAs($member)
            ->postJson('/api/bookings', ['studio_class_id' => $studioClass->id])
            ->assertCreated();

        $response = $this->actingAs($member)->postJson('/api/bookings', [
            'studio_class_id' => $studioClass->id,
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseCount('bookings', 1);
    }

    public function test_pay_per_class_credit_is_consumed_and_rejected_once_exhausted(): void
    {
        $member = User::factory()->create();
        $membership = Membership::factory()->for($member)->payPerClass(1)->create();
        $studioClassOne = StudioClass::factory()->create();
        $studioClassTwo = StudioClass::factory()->create();

        $this->actingAs($member)
            ->postJson('/api/bookings', ['studio_class_id' => $studioClassOne->id])
            ->assertCreated();

        $this->assertSame(0, $membership->fresh()->credits_remaining);

        $response = $this->actingAs($member)->postJson('/api/bookings', [
            'studio_class_id' => $studioClassTwo->id,
        ]);

        $response->assertStatus(422);
    }
}

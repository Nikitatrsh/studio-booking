<?php

namespace App\Models;

use App\Enums\BookingStatus;
use App\Enums\DayOfWeek;
use Database\Factories\StudioClassFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudioClass extends Model
{
    /** @use HasFactory<StudioClassFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'instructor_id',
        'capacity',
        'day_of_week',
        'start_time',
        'duration',
        'is_recurring',
    ];

    protected function casts(): array
    {
        return [
            'day_of_week' => DayOfWeek::class,
            'is_recurring' => 'boolean',
        ];
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function bookedCount(): int
    {
        return $this->bookings()->where('status', BookingStatus::Booked)->count();
    }

    public function hasAvailableSpot(): bool
    {
        return $this->bookedCount() < $this->capacity;
    }
}

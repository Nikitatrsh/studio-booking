<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Database\Factories\BookingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    /** @use HasFactory<BookingFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'studio_class_id',
        'status',
        'booked_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => BookingStatus::class,
            'booked_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function studioClass(): BelongsTo
    {
        return $this->belongsTo(StudioClass::class);
    }
}

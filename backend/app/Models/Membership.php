<?php

namespace App\Models;

use App\Enums\MembershipStatus;
use App\Enums\MembershipTier;
use Database\Factories\MembershipFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class Membership extends Model
{
    /** @use HasFactory<MembershipFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tier',
        'status',
        'start_date',
        'end_date',
        'credits_remaining',
    ];

    protected function casts(): array
    {
        return [
            'tier' => MembershipTier::class,
            'status' => MembershipStatus::class,
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        if ($this->status !== MembershipStatus::Active) {
            return false;
        }

        $today = Carbon::today();

        if ($this->start_date && $this->start_date->gt($today)) {
            return false;
        }

        if ($this->end_date && $this->end_date->lt($today)) {
            return false;
        }

        return true;
    }

    public function hasCreditsRemaining(): bool
    {
        if ($this->tier !== MembershipTier::PayPerClass) {
            return true;
        }

        return $this->credits_remaining !== null && $this->credits_remaining > 0;
    }
}

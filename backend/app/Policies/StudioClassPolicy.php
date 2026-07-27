<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\StudioClass;
use App\Models\User;

class StudioClassPolicy
{
    public function before(User $user): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    /**
     * Anyone can browse the class schedule.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, StudioClass $studioClass): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Instructor;
    }

    public function update(User $user, StudioClass $studioClass): bool
    {
        return $user->id === $studioClass->instructor_id;
    }

    public function delete(User $user, StudioClass $studioClass): bool
    {
        return $user->id === $studioClass->instructor_id;
    }
}

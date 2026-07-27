<?php

namespace App\Policies;

use App\Models\Membership;
use App\Models\User;

class MembershipPolicy
{
    /**
     * Memberships are managed by staff — only admins can create,
     * update or delete them. Everyone else falls through to the
     * read-only checks below.
     */
    public function before(User $user): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Membership $membership): bool
    {
        return $user->id === $membership->user_id;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Membership $membership): bool
    {
        return false;
    }

    public function delete(User $user, Membership $membership): bool
    {
        return false;
    }
}

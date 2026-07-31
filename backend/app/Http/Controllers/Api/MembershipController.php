<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMembershipRequest;
use App\Http\Requests\UpdateMembershipRequest;
use App\Models\Membership;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MembershipController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Membership::class);

        $query = Membership::with('user:id,name,email');

        if (! $request->user()->isAdmin()) {
            $query->where('user_id', $request->user()->id);
        }

        return response()->json($query->get());
    }

    public function store(StoreMembershipRequest $request): JsonResponse
    {
        $this->authorize('create', Membership::class);

        $membership = Membership::create($request->validated());
        $membership->refresh();

        return response()->json($membership->load('user:id,name,email'), 201);
    }

    public function show(Membership $membership): JsonResponse
    {
        $this->authorize('view', $membership);

        return response()->json($membership->load('user:id,name,email'));
    }

    public function update(UpdateMembershipRequest $request, Membership $membership): JsonResponse
    {
        $this->authorize('update', $membership);

        $membership->update($request->validated());

        return response()->json($membership->load('user:id,name,email'));
    }

    public function destroy(Membership $membership): JsonResponse
    {
        $this->authorize('delete', $membership);

        $membership->delete();

        return response()->json(null, 204);
    }
}

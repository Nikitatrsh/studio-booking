"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  ApiError,
  type Booking,
  type Membership,
  type MembershipUser,
  type StudioClass,
  type StudioClassInstructor,
} from "@/lib/api";
import { dayLabel, formatTime } from "@/lib/schedule";
import Card, { CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import ClassFormModal from "@/components/dashboard/ClassFormModal";
import MembershipFormModal from "@/components/dashboard/MembershipFormModal";

const membershipStatusTone = {
  active: "green",
  expired: "red",
  cancelled: "slate",
} as const;

export default function AdminDashboard() {
  const [classes, setClasses] = useState<StudioClass[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [classModal, setClassModal] = useState<"closed" | "create" | number>("closed");
  const [membershipModal, setMembershipModal] = useState<"closed" | "create" | number>("closed");

  const loadData = useCallback(async () => {
    try {
      const [classesData, membershipsData, bookingsData] = await Promise.all([
        api.studioClasses.list(),
        api.memberships.list(),
        api.bookings.list(),
      ]);
      setClasses(classesData);
      setMemberships(membershipsData);
      setBookings(bookingsData);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Failed to load the dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // The API has no /users listing endpoint, so "known users" are derived from
  // whoever already shows up as an instructor, member, or booker somewhere.
  const knownInstructors = useMemo(() => {
    const map = new Map<number, StudioClassInstructor>();
    classes.forEach((c) => {
      if (c.instructor) map.set(c.instructor.id, c.instructor);
    });
    return Array.from(map.values()).sort((a, b) => a.id - b.id);
  }, [classes]);

  const knownUsers = useMemo(() => {
    const map = new Map<number, MembershipUser>();
    memberships.forEach((m) => {
      if (m.user) map.set(m.user.id, m.user);
    });
    bookings.forEach((b) => {
      if (b.user) map.set(b.user.id, b.user);
    });
    return Array.from(map.values()).sort((a, b) => a.id - b.id);
  }, [memberships, bookings]);

  async function handleDeleteClass(studioClass: StudioClass) {
    if (!window.confirm(`Delete "${studioClass.name}"? This cannot be undone.`)) return;
    setMessage(null);
    try {
      await api.studioClasses.remove(studioClass.id);
      setMessage({ tone: "success", text: `${studioClass.name} was deleted.` });
      await loadData();
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof ApiError ? err.message : "Could not delete that class." });
    }
  }

  async function handleDeleteMembership(membership: Membership) {
    if (!window.confirm(`Delete this membership for ${membership.user?.name ?? "this user"}?`)) return;
    setMessage(null);
    try {
      await api.memberships.remove(membership.id);
      setMessage({ tone: "success", text: "Membership deleted." });
      await loadData();
    } catch (err) {
      setMessage({
        tone: "error",
        text: err instanceof ApiError ? err.message : "Could not delete that membership.",
      });
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  if (loadError) {
    return <Alert tone="error">{loadError}</Alert>;
  }

  const editingClass = typeof classModal === "number" ? classes.find((c) => c.id === classModal) : undefined;
  const editingMembership =
    typeof membershipModal === "number" ? memberships.find((m) => m.id === membershipModal) : undefined;
  const activeMembershipCount = memberships.filter((m) => m.status === "active").length;

  return (
    <div className="flex flex-col gap-6">
      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Total Classes</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{classes.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Active Memberships</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{activeMembershipCount}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Studio Classes</CardTitle>
          <Button onClick={() => setClassModal("create")}>New Class</Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Class</th>
                <th className="px-5 py-2 font-medium">Instructor</th>
                <th className="px-5 py-2 font-medium">Schedule</th>
                <th className="px-5 py-2 font-medium">Booked</th>
                <th className="px-5 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.map((studioClass) => (
                <tr key={studioClass.id}>
                  <td className="px-5 py-3 font-medium text-slate-900">{studioClass.name}</td>
                  <td className="px-5 py-3 text-slate-600">{studioClass.instructor?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {dayLabel(studioClass.day_of_week)} · {formatTime(studioClass.start_time)}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {studioClass.booked_count ?? 0}/{studioClass.capacity}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setClassModal(studioClass.id)}>
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => handleDeleteClass(studioClass)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-slate-500">
                    No classes yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Memberships</CardTitle>
          <Button onClick={() => setMembershipModal("create")}>New Membership</Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Member</th>
                <th className="px-5 py-2 font-medium">Tier</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium">Dates</th>
                <th className="px-5 py-2 font-medium">Credits</th>
                <th className="px-5 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {memberships.map((membership) => (
                <tr key={membership.id}>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {membership.user?.name ?? `User #${membership.user_id}`}
                    <div className="font-normal text-slate-500">{membership.user?.email}</div>
                  </td>
                  <td className="px-5 py-3 capitalize text-slate-600">{membership.tier.replace("-", " ")}</td>
                  <td className="px-5 py-3">
                    <Badge tone={membershipStatusTone[membership.status]}>{membership.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {membership.start_date.slice(0, 10)}
                    {membership.end_date ? ` – ${membership.end_date.slice(0, 10)}` : ""}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{membership.credits_remaining ?? "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setMembershipModal(membership.id)}>
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => handleDeleteMembership(membership)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {memberships.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-slate-500">
                    No memberships yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {classModal === "create" && (
        <ClassFormModal
          instructorOptions={knownInstructors}
          onClose={() => setClassModal("closed")}
          onSaved={loadData}
        />
      )}
      {editingClass && (
        <ClassFormModal
          studioClass={editingClass}
          instructorOptions={knownInstructors}
          onClose={() => setClassModal("closed")}
          onSaved={loadData}
        />
      )}

      {membershipModal === "create" && (
        <MembershipFormModal
          userOptions={knownUsers}
          onClose={() => setMembershipModal("closed")}
          onSaved={loadData}
        />
      )}
      {editingMembership && (
        <MembershipFormModal
          membership={editingMembership}
          onClose={() => setMembershipModal("closed")}
          onSaved={loadData}
        />
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type Booking, type Membership, type StudioClass } from "@/lib/api";
import { dayIndex, dayLabel, formatDuration, formatTime } from "@/lib/schedule";
import Card, { CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

const bookingStatusTone = {
  booked: "green",
  waitlisted: "amber",
  cancelled: "slate",
  attended: "blue",
} as const;

const membershipStatusTone = {
  active: "green",
  expired: "red",
  cancelled: "slate",
} as const;

interface FlashMessage {
  tone: "success" | "info" | "error";
  text: string;
}

export default function MemberDashboard() {
  const [classes, setClasses] = useState<StudioClass[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<FlashMessage | null>(null);
  const [pendingClassId, setPendingClassId] = useState<number | null>(null);
  const [pendingBookingId, setPendingBookingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [classesData, bookingsData, membershipsData] = await Promise.all([
        api.studioClasses.list(),
        api.bookings.list(),
        api.memberships.list(),
      ]);
      setClasses(classesData);
      setBookings(bookingsData);
      setMemberships(membershipsData);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Failed to load your dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleBook(studioClass: StudioClass) {
    setMessage(null);
    setPendingClassId(studioClass.id);
    try {
      const booking = await api.bookings.create(studioClass.id);
      setMessage(
        booking.status === "waitlisted"
          ? { tone: "info", text: `${studioClass.name} is full — you've been added to the waitlist.` }
          : { tone: "success", text: `You're booked for ${studioClass.name}.` },
      );
      await loadData();
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof ApiError ? err.message : "Could not book that class." });
    } finally {
      setPendingClassId(null);
    }
  }

  async function handleCancel(booking: Booking) {
    setMessage(null);
    setPendingBookingId(booking.id);
    try {
      await api.bookings.cancel(booking.id);
      setMessage({ tone: "success", text: "Booking cancelled." });
      await loadData();
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof ApiError ? err.message : "Could not cancel that booking." });
    } finally {
      setPendingBookingId(null);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  if (loadError) {
    return <Alert tone="error">{loadError}</Alert>;
  }

  const activeBookings = bookings.filter((b) => b.status === "booked" || b.status === "waitlisted");
  const sortedClasses = [...classes].sort(
    (a, b) => dayIndex(a.day_of_week) - dayIndex(b.day_of_week) || a.start_time.localeCompare(b.start_time),
  );

  return (
    <div className="flex flex-col gap-6">
      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Your Membership</CardTitle>
        </CardHeader>
        <CardBody>
          {memberships.length === 0 ? (
            <p className="text-sm text-slate-500">
              You don&apos;t have a membership yet. Contact the studio to get set up.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {memberships.map((membership) => (
                <div key={membership.id} className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-medium capitalize text-slate-900">
                    {membership.tier.replace("-", " ")}
                  </span>
                  <Badge tone={membershipStatusTone[membership.status]}>{membership.status}</Badge>
                  {membership.tier === "pay-per-class" && (
                    <span className="text-slate-500">
                      {membership.credits_remaining ?? 0} credit
                      {membership.credits_remaining === 1 ? "" : "s"} remaining
                    </span>
                  )}
                  <span className="text-slate-500">
                    {membership.start_date.slice(0, 10)}
                    {membership.end_date ? ` – ${membership.end_date.slice(0, 10)}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Classes</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Class</th>
                <th className="px-5 py-2 font-medium">Instructor</th>
                <th className="px-5 py-2 font-medium">Schedule</th>
                <th className="px-5 py-2 font-medium">Spots</th>
                <th className="px-5 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedClasses.map((studioClass) => {
                const existingBooking = activeBookings.find((b) => b.studio_class_id === studioClass.id);
                const isFull = (studioClass.booked_count ?? 0) >= studioClass.capacity;

                return (
                  <tr key={studioClass.id}>
                    <td className="px-5 py-3 font-medium text-slate-900">{studioClass.name}</td>
                    <td className="px-5 py-3 text-slate-600">{studioClass.instructor?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {dayLabel(studioClass.day_of_week)} · {formatTime(studioClass.start_time)} ·{" "}
                      {formatDuration(studioClass.duration)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {studioClass.booked_count ?? 0}/{studioClass.capacity}
                      {(studioClass.waitlisted_count ?? 0) > 0 && (
                        <span className="text-slate-400"> (+{studioClass.waitlisted_count} waiting)</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {existingBooking ? (
                        <Badge tone={bookingStatusTone[existingBooking.status]}>{existingBooking.status}</Badge>
                      ) : (
                        <Button
                          variant="secondary"
                          disabled={pendingClassId === studioClass.id}
                          onClick={() => handleBook(studioClass)}
                        >
                          {pendingClassId === studioClass.id ? "Booking…" : isFull ? "Join Waitlist" : "Book"}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {sortedClasses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-slate-500">
                    No classes on the schedule yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Bookings</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Class</th>
                <th className="px-5 py-2 font-medium">Schedule</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {booking.studio_class?.name ?? `Class #${booking.studio_class_id}`}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {booking.studio_class
                      ? `${dayLabel(booking.studio_class.day_of_week)} · ${formatTime(booking.studio_class.start_time)}`
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={bookingStatusTone[booking.status]}>{booking.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {(booking.status === "booked" || booking.status === "waitlisted") && (
                      <Button
                        variant="danger"
                        disabled={pendingBookingId === booking.id}
                        onClick={() => handleCancel(booking)}
                      >
                        {pendingBookingId === booking.id ? "Cancelling…" : "Cancel"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-slate-500">
                    You haven&apos;t booked any classes yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type Booking, type StudioClass, type User } from "@/lib/api";
import { dayIndex, dayLabel, formatDuration, formatTime } from "@/lib/schedule";
import Card, { CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import ClassFormModal from "@/components/dashboard/ClassFormModal";

const bookingStatusTone = {
  booked: "green",
  waitlisted: "amber",
  cancelled: "slate",
  attended: "blue",
} as const;

export default function InstructorDashboard({ user }: { user: User }) {
  const [classes, setClasses] = useState<StudioClass[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<"closed" | "create" | number>("closed");

  const loadData = useCallback(async () => {
    try {
      const [classesData, bookingsData] = await Promise.all([api.studioClasses.list(), api.bookings.list()]);
      setClasses(classesData);
      setBookings(bookingsData);
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

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  if (loadError) {
    return <Alert tone="error">{loadError}</Alert>;
  }

  const myClasses = [...classes]
    .filter((studioClass) => studioClass.instructor_id === user.id)
    .sort((a, b) => dayIndex(a.day_of_week) - dayIndex(b.day_of_week) || a.start_time.localeCompare(b.start_time));

  const editingClass =
    typeof modalState === "number" ? myClasses.find((c) => c.id === modalState) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Your Classes</h1>
        <Button onClick={() => setModalState("create")}>New Class</Button>
      </div>

      {myClasses.length === 0 && (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">You don&apos;t have any classes yet.</p>
          </CardBody>
        </Card>
      )}

      {myClasses.map((studioClass) => {
        const roster = bookings
          .filter((b) => b.studio_class_id === studioClass.id && b.status !== "cancelled")
          .sort((a, b) => (a.status === b.status ? 0 : a.status === "booked" ? -1 : 1));

        return (
          <Card key={studioClass.id}>
            <CardHeader>
              <div>
                <CardTitle>{studioClass.name}</CardTitle>
                <p className="mt-0.5 text-sm text-slate-500">
                  {dayLabel(studioClass.day_of_week)} · {formatTime(studioClass.start_time)} ·{" "}
                  {formatDuration(studioClass.duration)} · {studioClass.booked_count ?? 0}/{studioClass.capacity}{" "}
                  booked
                  {(studioClass.waitlisted_count ?? 0) > 0 && `, ${studioClass.waitlisted_count} waitlisted`}
                </p>
              </div>
              <Button variant="secondary" onClick={() => setModalState(studioClass.id)}>
                Edit
              </Button>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-2 font-medium">Attendee</th>
                    <th className="px-5 py-2 font-medium">Email</th>
                    <th className="px-5 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-5 py-2.5 font-medium text-slate-900">{booking.user?.name ?? "—"}</td>
                      <td className="px-5 py-2.5 text-slate-600">{booking.user?.email ?? "—"}</td>
                      <td className="px-5 py-2.5">
                        <Badge tone={bookingStatusTone[booking.status]}>{booking.status}</Badge>
                      </td>
                    </tr>
                  ))}
                  {roster.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-4 text-center text-slate-500">
                        No bookings yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}

      {modalState === "create" && (
        <ClassFormModal onClose={() => setModalState("closed")} onSaved={loadData} />
      )}
      {editingClass && (
        <ClassFormModal studioClass={editingClass} onClose={() => setModalState("closed")} onSaved={loadData} />
      )}
    </div>
  );
}

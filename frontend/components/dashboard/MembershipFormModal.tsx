"use client";

import { FormEvent, useState } from "react";
import {
  api,
  ApiError,
  type Membership,
  type MembershipStatus,
  type MembershipTier,
  type MembershipUser,
} from "@/lib/api";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

interface MembershipFormModalProps {
  membership?: Membership;
  userOptions?: MembershipUser[];
  onClose: () => void;
  onSaved: () => void;
}

export default function MembershipFormModal({
  membership,
  userOptions,
  onClose,
  onSaved,
}: MembershipFormModalProps) {
  const isEditing = Boolean(membership);
  const [userId, setUserId] = useState(
    membership?.user_id.toString() ?? userOptions?.[0]?.id.toString() ?? "",
  );
  const [tier, setTier] = useState<MembershipTier>(membership?.tier ?? "monthly-unlimited");
  const [status, setStatus] = useState<MembershipStatus>(membership?.status ?? "active");
  const [startDate, setStartDate] = useState(
    membership?.start_date.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(membership?.end_date?.slice(0, 10) ?? "");
  const [credits, setCredits] = useState(membership?.credits_remaining?.toString() ?? "10");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      tier,
      status,
      start_date: startDate,
      end_date: endDate || null,
      credits_remaining: tier === "pay-per-class" ? Number(credits) : null,
    };

    try {
      if (membership) {
        await api.memberships.update(membership.id, payload);
      } else {
        await api.memberships.create({ user_id: Number(userId), ...payload });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this membership.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEditing ? "Edit Membership" : "New Membership"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}

        {!isEditing && (
          <Select
            label="Member"
            name="user_id"
            required
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            {(userOptions?.length ?? 0) === 0 && <option value="">No known users yet</option>}
            {userOptions?.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} ({option.email})
              </option>
            ))}
          </Select>
        )}

        <Select label="Tier" name="tier" value={tier} onChange={(e) => setTier(e.target.value as MembershipTier)}>
          <option value="monthly-unlimited">Monthly Unlimited</option>
          <option value="pay-per-class">Pay Per Class</option>
          <option value="student">Student</option>
        </Select>

        {isEditing && (
          <Select
            label="Status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as MembershipStatus)}
          >
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            name="start_date"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End Date"
            name="end_date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {tier === "pay-per-class" && (
          <Input
            label="Credits"
            name="credits_remaining"
            type="number"
            min={0}
            required
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
          />
        )}

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

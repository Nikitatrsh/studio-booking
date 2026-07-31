"use client";

import { useAuth } from "@/context/AuthContext";
import MemberDashboard from "@/components/dashboard/MemberDashboard";
import InstructorDashboard from "@/components/dashboard/InstructorDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === "admin") return <AdminDashboard />;
  if (user.role === "instructor") return <InstructorDashboard user={user} />;
  return <MemberDashboard />;
}

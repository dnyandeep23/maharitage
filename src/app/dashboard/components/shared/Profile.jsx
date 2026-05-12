import React from "react";
import { Mail, Shield, UserRound } from "lucide-react";

const Profile = ({ user }) => {
  const details = [
    { label: "Username", value: user?.username || "Not set", icon: <UserRound className="h-5 w-5" /> },
    { label: "Email", value: user?.email || "Not set", icon: <Mail className="h-5 w-5" /> },
    { label: "Role", value: user?.role || "public-user", icon: <Shield className="h-5 w-5" /> },
  ];

  return (
    <div className="dashboard-section mx-auto w-full max-w-5xl">
      <div className="mb-8">
        <p className="archive-kicker text-[#8a6a31]">Account identity</p>
        <h2 className="dashboard-section-title mt-2 text-3xl sm:text-4xl">User Profile</h2>
        <p className="dashboard-section-copy mt-3 max-w-2xl text-sm">
          Your dashboard identity and access role for MahaRitage workflows.
        </p>
      </div>

      <div className="dashboard-panel p-4 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#123327] text-3xl font-bold uppercase text-[#fffaf0] shadow-lg shadow-emerald-950/10">
            {user?.username?.[0] || "U"}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-2xl font-bold text-[#123327]">{user?.username || "User"}</h3>
            <p className="mt-1 break-all text-sm text-stone-500">{user?.email}</p>
            <span className="dashboard-badge mt-3">{user?.role}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {details.map((item) => (
            <div key={item.label} className="rounded-2xl border border-[#123327]/10 bg-[#fffaf0]/58 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#123327]/8 text-[#8a6a31]">
                {item.icon}
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">{item.label}</p>
              <p className="mt-1 break-words text-sm font-semibold text-[#123327]">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;

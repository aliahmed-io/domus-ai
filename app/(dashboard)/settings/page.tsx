"use client";

import React, { useState } from "react";
import {
  User,
  Shield,
  Bell,
  Lock,
  CreditCard,
  Key,
  Trash,
  Upload,
  Sparkles,
  Save,
  CheckCircle,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SettingsTab =
  | "profile"
  | "account"
  | "notifications"
  | "privacy"
  | "billing"
  | "api-keys"
  | "danger-zone";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Form State
  const [displayName, setDisplayName] = useState("Ali Ahmed");
  const [username, setUsername] = useState("aliahmed");
  const [bio, setBio] = useState("Design architect & full-stack spatial researcher.");
  const [website, setWebsite] = useState("https://domus.ai");
  const [location, setLocation] = useState("New York, USA");
  const [role, setRole] = useState("Architect");
  const [firmName, setFirmName] = useState("Domus");
  const [experience, setExperience] = useState(8);
  const [specializations, setSpecializations] = useState<string[]>([
    "BIM Modeling",
    "Generative Interiors",
    "WebXR Prototyping",
  ]);
  const [newTag, setNewTag] = useState("");

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim() && !specializations.includes(newTag.trim())) {
      setSpecializations([...specializations, newTag.trim()]);
      setNewTag("");
      setHasUnsavedChanges(true);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSpecializations(specializations.filter((t) => t !== tag));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setHasUnsavedChanges(false);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    }, 1000);
  };

  const menuItems: { id: SettingsTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: "profile", label: "Profile Info", icon: User },
    { id: "account", label: "Account Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Auth", icon: Lock },
    { id: "billing", label: "Billing & Plans", icon: CreditCard },
    { id: "api-keys", label: "API Credentials", icon: Key },
    { id: "danger-zone", label: "Danger Zone", icon: Trash },
  ];

  return (
    <div className="w-full min-h-screen flex flex-col p-6 md:p-8 bg-alabaster">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="mb-8">
        <h1 className="font-jakarta text-heading-xl font-800 text-charcoal tracking-tight">
          Settings
        </h1>
        <p className="font-body text-sm text-stone mt-0.5">
          Configure your professional identity, design defaults, and developer credentials.
        </p>
      </header>

      {/* ── SETTINGS CORE ─────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Side Navigation */}
        <aside className="w-full lg:w-64 bg-white rounded-2xl border border-hairline p-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible shrink-0 shadow-card">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-3 text-xs font-semibold rounded-xl transition-all duration-200 outline-none whitespace-nowrap lg:whitespace-normal",
                activeTab === item.id
                  ? "bg-indigo text-white shadow-sm"
                  : "text-stone hover:text-charcoal hover:bg-gray-50"
              )}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Right Side Settings Panel */}
        <main className="flex-1 w-full bg-white rounded-2xl border border-hairline shadow-card overflow-hidden relative">
          {activeTab === "profile" ? (
            <div className="p-6 md:p-8 flex flex-col gap-8">
              {/* Profile Header */}
              <div className="border-b border-hairline pb-4 flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="font-jakarta text-heading-sm font-700 text-charcoal">
                    Profile Information
                  </h3>
                  <p className="font-body text-xs text-stone mt-0.5">
                    This information is displayed publicly on your community discovery profile.
                  </p>
                </div>

                {hasUnsavedChanges && (
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-amber bg-amberLight border border-amber/10 px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                      Unsaved Changes
                    </span>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="btn-primary flex items-center gap-1.5 text-xs font-semibold py-2 px-4 bg-charcoal text-white hover:bg-black rounded-lg transition-all"
                    >
                      <Save size={13} />
                      <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Grid split: avatar left, fields right */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar upload */}
                <div className="flex flex-col items-center gap-4 w-full md:w-auto shrink-0">
                  <div className="group relative w-32 h-32 rounded-full bg-indigo-light text-indigo border border-hairline shadow-inner flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo/55 transition-all">
                    <span className="font-jakarta text-2xl font-bold uppercase tracking-wide">
                      AH
                    </span>
                    <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Upload size={20} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-body text-xs font-semibold text-charcoal">
                      Avatar Initial
                    </p>
                    <p className="font-body text-[10px] text-muted mt-0.5">
                      Puter identity sync
                    </p>
                  </div>
                </div>

                {/* Form fields */}
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-body text-xs font-bold text-charcoal">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="px-3.5 py-2.5 bg-alabaster border border-hairline rounded-lg text-xs font-medium text-charcoal focus:bg-white focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-body text-xs font-bold text-charcoal">
                      Username
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-[11px] text-xs font-semibold text-stone">
                        @
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="pl-7 pr-3.5 py-2.5 w-full bg-alabaster border border-hairline rounded-lg text-xs font-medium text-charcoal focus:bg-white focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="font-body text-xs font-bold text-charcoal">
                      Bio (Max 150 characters)
                    </label>
                    <textarea
                      maxLength={150}
                      rows={3}
                      value={bio}
                      onChange={(e) => {
                        setBio(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="px-3.5 py-2.5 bg-alabaster border border-hairline rounded-lg text-xs font-medium text-charcoal focus:bg-white focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all outline-none resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-body text-xs font-bold text-charcoal">
                      Website
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => {
                        setWebsite(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="px-3.5 py-2.5 bg-alabaster border border-hairline rounded-lg text-xs font-medium text-charcoal focus:bg-white focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-body text-xs font-bold text-charcoal">
                      Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="px-3.5 py-2.5 bg-alabaster border border-hairline rounded-lg text-xs font-medium text-charcoal focus:bg-white focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Credentials Section */}
              <div className="border-t border-hairline pt-6 flex flex-col gap-5">
                <div>
                  <h4 className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider">
                    Professional Credentials
                  </h4>
                  <p className="font-body text-[11px] text-stone mt-0.5">
                    Set up your industry context to fine-tune AI assistant outputs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-body text-xs font-bold text-charcoal">
                      Professional Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => {
                        setRole(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="px-3.5 py-2.5 bg-alabaster border border-hairline rounded-lg text-xs font-medium text-charcoal focus:bg-white focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all outline-none cursor-pointer"
                    >
                      <option>Architect</option>
                      <option>Interior Designer</option>
                      <option>3D Visualizer</option>
                      <option>BIM Engineer</option>
                      <option>Spatial Researcher</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-body text-xs font-bold text-charcoal">
                      Firm / Studio Name
                    </label>
                    <input
                      type="text"
                      value={firmName}
                      onChange={(e) => {
                        setFirmName(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="px-3.5 py-2.5 bg-alabaster border border-hairline rounded-lg text-xs font-medium text-charcoal focus:bg-white focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-3 md:col-span-2">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <label className="font-body text-xs font-bold text-charcoal">
                        Years of Spatial Experience
                      </label>
                      <span className="font-body text-xs font-bold text-indigo">
                        {experience} years
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={experience}
                      onChange={(e) => {
                        setExperience(Number(e.target.value));
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full h-1.5 bg-indigo-light rounded-lg appearance-none cursor-pointer accent-indigo"
                    />
                  </div>

                  {/* Specializations Tag Editor */}
                  <div className="flex flex-col gap-2.5 md:col-span-2">
                    <label className="font-body text-xs font-bold text-charcoal">
                      Specializations & Tags
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-3.5 bg-alabaster border border-hairline rounded-xl min-h-[48px]">
                      {specializations.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1.5 px-3 py-1 bg-white text-[10px] font-bold text-charcoal uppercase tracking-wider rounded-lg border border-hairline shadow-sm"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-stone hover:text-error transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {specializations.length === 0 && (
                        <span className="text-xs text-stone italic">
                          No specializations added yet.
                        </span>
                      )}
                    </div>

                    <form onSubmit={handleAddTag} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add new tag (e.g. LiDAR scanning)"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 bg-alabaster border border-hairline rounded-lg text-xs font-medium text-charcoal focus:bg-white focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
                      >
                        <Plus size={14} />
                        <span>Add</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-light text-indigo flex items-center justify-center mb-4">
                <Sparkles size={22} />
              </div>
              <h3 className="font-jakarta text-heading-sm font-700 text-charcoal mb-1">
                Tab under development
              </h3>
              <p className="font-body text-xs text-stone max-w-xs">
                The {activeTab} panel interface is managed securely via Puter account credentials.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* ── TOAST NOTIFICATION ────────────────────────────────────────────── */}
      {showSavedToast && (
        <div className="fixed bottom-6 right-6 bg-charcoal text-white rounded-xl py-3.5 px-5 shadow-modal z-50 flex items-center gap-2.5 border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CheckCircle size={16} className="text-success" />
          <span className="font-body text-xs font-semibold">
            Settings updated successfully!
          </span>
        </div>
      )}
    </div>
  );
}

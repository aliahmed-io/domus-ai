"use client";
import { useState, useEffect } from "react";
import { Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { kvGet, kvSet } from "@/lib/puter";

type Profile = { name: string; bio: string };
export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>({ name: "", bio: "" });
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    kvGet<Profile>("profile").then((saved) => {
      if (!active) return;
      if (
        saved &&
        typeof saved.name === "string" &&
        typeof saved.bio === "string"
      )
        setProfile(saved);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const ok = await kvSet("profile", {
        name: profile.name.trim(),
        bio: profile.bio.trim(),
      });
      if (ok) toast.success("Profile saved in this browser.");
      else
        toast.error(
          "Could not save. Your browser storage may be full or unavailable.",
        );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="local-settings">
      <span className="studio-kicker">
        <UserRound size={18} /> Your workshop
      </span>
      <h1>Make yourself at home.</h1>
      <p>This profile stays on this device. No account or password needed.</p>
      <form onSubmit={save}>
        <label htmlFor="profile-name">What should we call you?</label>
        <input
          id="profile-name"
          autoComplete="nickname"
          maxLength={60}
          value={profile.name}
          disabled={!ready}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          placeholder="Designer"
        />
        <label htmlFor="profile-bio">A little about your projects</label>
        <textarea
          id="profile-bio"
          maxLength={300}
          rows={5}
          value={profile.bio}
          disabled={!ready}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          placeholder="What would you like to create?"
        />
        <button
          className="studio-button"
          disabled={!ready || saving}
          type="submit"
        >
          <Save size={17} />
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
      <small>
        Projects and preferences are stored in this browser. Export your
        projects before clearing browsing data. Billing, cloud accounts, and API
        key management are not enabled in this version.
      </small>
    </div>
  );
}

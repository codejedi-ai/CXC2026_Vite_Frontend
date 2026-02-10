import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCamera, FaSave, FaTimes, FaPlus, FaCheck, FaUpload } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import { useAuth } from "@/contexts/AuthContext";
import { uploadProfilePicture, uploadBannerPicture, validateImageFile } from "@/lib/imageUpload";
import { profileApi } from "@/lib/api";

const LOOKING_FOR_OPTIONS = [
  "Genuine Connection",
  "Long-term Relationship",
  "Something Casual",
  "Friends First",
  "Study Buddy",
  "Adventure Partner",
  "Someone Fun",
  "Creative Spark",
  "My Person",
  "Something Real",
];

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Other", "Prefer not to say"];

const SUGGESTED_INTERESTS = [
  "Coding", "Coffee", "Hiking", "Gaming", "Music", "Photography",
  "Cooking", "Anime", "Art", "Dance", "Movies", "Reading",
  "Basketball", "Skateboarding", "Yoga", "Travel", "Ramen",
  "Board Games", "K-dramas", "Bubble Tea", "Memes", "Fashion",
  "Guitar", "Piano", "Volunteering", "Podcasts", "Stargazing",
];

interface ProfileForm {
  display_name: string;
  age: number;
  gender: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  location: string;
  looking_for: string;
  interests: string[];
}

const EMPTY_FORM: ProfileForm = {
  display_name: "",
  age: 20,
  gender: "",
  bio: "",
  avatar_url: "",
  banner_url: "",
  location: "",
  looking_for: "",
  interests: [],
};

export default function MyProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [newInterest, setNewInterest] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const data = await profileApi.getProfile();

        if (data) {
          setForm({
            display_name: data.display_name || "",
            age: data.age || 20,
            gender: data.gender || "",
            bio: data.bio || "",
            avatar_url: data.avatar_url || "",
            banner_url: data.banner_url || "",
            location: data.location || "",
            looking_for: data.looking_for || "",
            interests: data.interests || [],
          });
          setHasProfile(true);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    const validation = validateImageFile(file);

    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    setUploadingAvatar(true);
    setError(null);

    const result = await uploadProfilePicture(file, user.id);

    setUploadingAvatar(false);

    if (result.success && result.url) {
      setForm((prev) => ({ ...prev, avatar_url: result.url! }));
    } else {
      setError(result.error || "Upload failed");
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    const validation = validateImageFile(file);

    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    setUploadingBanner(true);
    setError(null);

    const result = await uploadBannerPicture(file, user.id);

    setUploadingBanner(false);

    if (result.success && result.url) {
      setForm((prev) => ({ ...prev, banner_url: result.url! }));
    } else {
      setError(result.error || "Upload failed");
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setError(null);

    if (!form.display_name.trim()) {
      setError("Display name is required");
      return;
    }

    setSaving(true);

    const payload = {
      user_id: user.id,
      display_name: form.display_name.trim(),
      age: form.age,
      gender: form.gender,
      bio: form.bio.trim(),
      avatar_url: form.avatar_url.trim(),
      banner_url: form.banner_url.trim(),
      location: form.location.trim(),
      looking_for: form.looking_for,
      interests: form.interests,
      type: "human" as const,
      online_status: true,
    };

    try {
      await profileApi.saveProfile(payload);
      setHasProfile(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    }

    setSaving(false);
  };

  const toggleInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : prev.interests.length < 8
          ? [...prev.interests, interest]
          : prev.interests,
    }));
  };

  const addCustomInterest = () => {
    const trimmed = newInterest.trim();
    if (!trimmed || form.interests.includes(trimmed) || form.interests.length >= 8) return;
    setForm((prev) => ({ ...prev, interests: [...prev.interests, trimmed] }));
    setNewInterest("");
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#00ffff]/30 border-t-[#00ffff] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 py-8 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-display tracking-wider">
            MY <span className="text-[#00ffff] neon-glow-cyan">PROFILE</span>
          </h1>
          <p className="text-gray-400 font-body text-sm">
            {hasProfile ? "Update your profile details" : "Set up your profile to start connecting"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="space-y-6"
        >
          <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
            <SectionLabel text="BANNER IMAGE" />
            <div className="space-y-4">
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[#00ffff]/20 bg-[#0a0b1a]">
                {form.banner_url ? (
                  <img
                    src={form.banner_url}
                    alt="Banner"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaCamera className="text-gray-600 text-2xl" />
                  </div>
                )}
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleBannerUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0a0b1a]/80 border border-[#00ffff]/30 text-[#00ffff] text-sm font-medium hover:bg-[#00ffff]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaUpload className="text-xs" />
                {uploadingBanner ? "Uploading..." : "Upload Banner Image"}
              </button>
              <p className="text-[11px] text-gray-600 font-body">Max 5MB. JPEG, PNG, WebP, or GIF</p>
            </div>

            <div className="border-t border-white/5" />

            <SectionLabel text="PROFILE PICTURE" />
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#00ffff]/20 bg-[#0a0b1a] flex-shrink-0">
                {form.avatar_url ? (
                  <img
                    src={form.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaCamera className="text-gray-600 text-xl" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0a0b1a]/80 border border-[#00ffff]/30 text-[#00ffff] text-sm font-medium hover:bg-[#00ffff]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaUpload className="text-xs" />
                  {uploadingAvatar ? "Uploading..." : "Upload Profile Picture"}
                </button>
                <p className="text-[11px] text-gray-600 mt-1.5 font-body">Max 5MB. JPEG, PNG, WebP, or GIF</p>
              </div>
            </div>

            <div className="border-t border-white/5" />

            <SectionLabel text="BASIC INFO" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="DISPLAY NAME">
                <input
                  type="text"
                  maxLength={30}
                  placeholder="Your name"
                  value={form.display_name}
                  onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0a0b1a]/80 border border-[#00ffff]/15 text-white text-sm font-body placeholder-gray-600 focus:outline-none focus:border-[#00ffff]/40 transition-all"
                />
              </FieldGroup>

              <FieldGroup label="AGE">
                <input
                  type="number"
                  min={18}
                  max={99}
                  value={form.age}
                  onChange={(e) => setForm((p) => ({ ...p, age: Math.max(18, Math.min(99, Number(e.target.value))) }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0a0b1a]/80 border border-[#00ffff]/15 text-white text-sm font-body placeholder-gray-600 focus:outline-none focus:border-[#00ffff]/40 transition-all"
                />
              </FieldGroup>

              <FieldGroup label="GENDER">
                <select
                  value={form.gender}
                  onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0a0b1a]/80 border border-[#00ffff]/15 text-white text-sm font-body focus:outline-none focus:border-[#00ffff]/40 transition-all appearance-none"
                >
                  <option value="" className="bg-[#0a0b1a]">Select...</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g} className="bg-[#0a0b1a]">{g}</option>
                  ))}
                </select>
              </FieldGroup>

              <FieldGroup label="LOCATION">
                <input
                  type="text"
                  maxLength={50}
                  placeholder="City, Province"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0a0b1a]/80 border border-[#00ffff]/15 text-white text-sm font-body placeholder-gray-600 focus:outline-none focus:border-[#00ffff]/40 transition-all"
                />
              </FieldGroup>
            </div>

            <div className="border-t border-white/5" />

            <SectionLabel text="ABOUT YOU" />
            <FieldGroup label="BIO">
              <textarea
                maxLength={300}
                rows={4}
                placeholder="Tell people about yourself..."
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-[#0a0b1a]/80 border border-[#00ffff]/15 text-white text-sm font-body placeholder-gray-600 focus:outline-none focus:border-[#00ffff]/40 transition-all resize-none"
              />
              <p className="text-[11px] text-gray-600 mt-1 font-body text-right">{form.bio.length}/300</p>
            </FieldGroup>

            <FieldGroup label="LOOKING FOR">
              <div className="flex flex-wrap gap-2">
                {LOOKING_FOR_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, looking_for: p.looking_for === opt ? "" : opt }))}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 font-body ${
                      form.looking_for === opt
                        ? "bg-[#ff0080]/15 text-[#ff0080] border border-[#ff0080]/40"
                        : "bg-transparent text-gray-500 border border-gray-800 hover:border-gray-600 hover:text-gray-400"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </FieldGroup>

            <div className="border-t border-white/5" />

            <SectionLabel text="INTERESTS" />
            <p className="text-[11px] text-gray-500 font-body -mt-3">
              Pick up to 8 interests ({form.interests.length}/8)
            </p>

            {form.interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.interests.map((interest) => (
                  <span
                    key={interest}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff]/30 font-body"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className="hover:text-white transition-colors"
                    >
                      <FaTimes className="text-[8px]" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {SUGGESTED_INTERESTS.filter((i) => !form.interests.includes(i)).map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  disabled={form.interests.length >= 8}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-500 border border-gray-800 hover:border-gray-600 hover:text-gray-400 transition-all duration-200 font-body disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {interest}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                maxLength={25}
                placeholder="Add custom interest..."
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomInterest())}
                className="flex-1 px-4 py-2 rounded-lg bg-[#0a0b1a]/80 border border-[#00ffff]/15 text-white text-sm font-body placeholder-gray-600 focus:outline-none focus:border-[#00ffff]/40 transition-all"
              />
              <button
                type="button"
                onClick={addCustomInterest}
                disabled={!newInterest.trim() || form.interests.length >= 8}
                className="px-3 py-2 rounded-lg border border-[#00ffff]/30 text-[#00ffff] hover:bg-[#00ffff]/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <FaPlus className="text-xs" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-body text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-gradient-to-r from-[#ff0080] to-[#cc0066] text-white font-bold text-xs tracking-wider rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#ff0080]/20 font-display disabled:opacity-50"
          >
            {saving ? (
              "SAVING..."
            ) : saved ? (
              <>
                <FaCheck className="text-[10px]" />
                SAVED
              </>
            ) : (
              <>
                <FaSave className="text-[10px]" />
                {hasProfile ? "UPDATE PROFILE" : "CREATE PROFILE"}
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <HiSparkles className="text-[#00ffff] text-xs" />
      <span className="text-xs text-gray-400 tracking-widest font-display font-bold">{text}</span>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] text-gray-500 tracking-wider font-display mb-1.5">{label}</label>
      {children}
    </div>
  );
}

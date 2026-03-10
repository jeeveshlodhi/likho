import { useState, useEffect } from 'react';
import { User, Mail, Globe, Clock, Camera, Loader2, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SettingsSection } from './SettingsSection';

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const locales = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'ru', label: 'Русский' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
];

export function AccountSettings() {
  const profile = useSettingsStore((state) => state.profile);
  const updateProfile = useSettingsStore((state) => state.updateProfile);
  const saveProfileToBackend = useSettingsStore((state) => state.saveProfileToBackend);
  const syncFromBackend = useSettingsStore((state) => state.syncFromBackend);
  const isSaving = useSettingsStore((state) => state.isSaving);
  const isLoading = useSettingsStore((state) => state.isLoading);
  const error = useSettingsStore((state) => state.error);
  const { user } = useAuthStore();

  const [showSuccess, setShowSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Sync settings from backend on mount
  useEffect(() => {
    syncFromBackend();
  }, [syncFromBackend]);

  // Sync auth user data with settings profile
  useEffect(() => {
    if (user) {
      updateProfile({
        id: String(user.id),
        email: user.email,
        fullName: user.full_name || profile.fullName,
        username: user.username || profile.username,
      });
    }
  }, [user]);

  const handleSave = async () => {
    setShowSuccess(false);
    setLocalError(null);

    const success = await saveProfileToBackend();

    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      setLocalError(error || 'Failed to save changes. Please try again.');
    }
  };

  const handleAvatarChange = () => {
    // TODO: Implement avatar upload
    // This would open a file picker and upload the image
    alert('Avatar upload coming soon!');
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {(localError || error) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{localError || error}</AlertDescription>
        </Alert>
      )}

      {/* Profile Section */}
      <SettingsSection
        title="Profile Information"
        description="Update your personal information and how others see you"
      >
        <div className="flex items-start gap-6">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {profile.fullName?.charAt(0) || profile.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleAvatarChange}>
              <Camera size={14} />
              Change Photo
            </Button>
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    id="fullName"
                    value={profile.fullName}
                    onChange={(e) => updateProfile({ fullName: e.target.value })}
                    className="pl-10"
                    placeholder="Your full name"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profile.username}
                  onChange={(e) => updateProfile({ username: e.target.value })}
                  placeholder="@username"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => updateProfile({ bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={3}
                disabled={isLoading}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">
                Brief description for your profile. Maximum 160 characters.
                {profile.bio && ` (${profile.bio.length}/160)`}
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      {/* Email Section */}
      <SettingsSection
        title="Email Address"
        description="Manage your email address and verification status"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                id="email"
                type="email"
                value={user?.email || profile.email}
                disabled
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex-1">
              <p className="font-medium">Email Verification</p>
              <p className="text-sm text-muted-foreground">
                {user?.email_verified
                  ? 'Your email is verified. You can receive notifications and reset your password.'
                  : 'Your email is not verified. Please check your inbox for a verification link.'}
              </p>
            </div>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                user?.email_verified
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-amber-500/10 text-amber-600'
              }`}
            >
              {user?.email_verified ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
            </div>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      {/* Regional Settings */}
      <SettingsSection
        title="Regional Settings"
        description="Configure your timezone and language preferences"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="timezone" className="flex items-center gap-2">
              <Clock size={16} />
              Timezone
            </Label>
            <Select
              value={profile.timezone}
              onValueChange={(value) => updateProfile({ timezone: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locale" className="flex items-center gap-2">
              <Globe size={16} />
              Language
            </Label>
            <Select
              value={profile.locale}
              onValueChange={(value) => updateProfile({ locale: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {locales.map((locale) => (
                  <SelectItem key={locale.value} value={locale.value}>
                    {locale.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      {/* Danger Zone */}
      <SettingsSection
        title="Danger Zone"
        description="Irreversible actions for your account"
        variant="destructive"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div>
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button variant="destructive" disabled>
              Delete Account
            </Button>
          </div>
        </div>
      </SettingsSection>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 pt-4">
        {showSuccess && (
          <span className="text-sm text-green-600">Changes saved successfully!</span>
        )}
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
}

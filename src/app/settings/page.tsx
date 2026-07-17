import { SettingsPanel } from '@/domains/settings/components/organisms/settings-panel';

export default function SettingsPage() {
  return (
    <main className="relative z-[2] mx-auto max-w-[1180px] px-4 pt-[26px] pb-[80px] sm:px-[34px]">
      <SettingsPanel />
    </main>
  );
}

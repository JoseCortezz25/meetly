import { RecordingRequirementsGate } from '@/components/system/recording-requirements-gate';
import { RecordingWorkspace } from '@/domains/meetings/components/organisms/recording-workspace';

export default function RecordPage() {
  return (
    <main className="relative z-[2] mx-auto max-w-[1000px] px-4 pt-[26px] pb-[60px] sm:px-[34px]">
      <RecordingRequirementsGate>
        <RecordingWorkspace />
      </RecordingRequirementsGate>
    </main>
  );
}

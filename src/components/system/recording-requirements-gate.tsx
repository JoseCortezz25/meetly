'use client';

import type { ReactNode } from 'react';
import { RECORDING_REQUIREMENTS } from '@/lib/system-capabilities';
import { RequirementsModal } from './requirements-modal';
import { useSystemCapabilities } from './use-system-capabilities';

type RecordingRequirementsGateProps = {
  children: ReactNode;
};

export const RecordingRequirementsGate = ({
  children
}: RecordingRequirementsGateProps) => {
  const { status, report, missing, dismissed, dismiss, recheck } =
    useSystemCapabilities(RECORDING_REQUIREMENTS);

  const showModal = status === 'ready' && missing.length > 0 && !dismissed;

  return (
    <>
      {children}
      {showModal && (
        <RequirementsModal
          missing={missing}
          report={report}
          onContinue={dismiss}
          onRecheck={recheck}
        />
      )}
    </>
  );
};

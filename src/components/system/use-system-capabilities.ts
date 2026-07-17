'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type CapabilityKey,
  type SystemReport,
  detectSystem,
  missingCapabilities
} from '@/lib/system-capabilities';

type Status = 'checking' | 'ready';

export const useSystemCapabilities = (required: CapabilityKey[]) => {
  const [status, setStatus] = useState<Status>('checking');
  const [report, setReport] = useState<SystemReport | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const requiredRef = useRef(required);
  requiredRef.current = required;

  const check = useCallback(() => {
    setStatus('checking');
    let active = true;
    detectSystem()
      .then(result => {
        if (active) {
          setReport(result);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (active) setStatus('ready');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => check(), [check]);

  const missing = report
    ? missingCapabilities(report, requiredRef.current)
    : [];

  return {
    status,
    report,
    missing,
    isSupported: status === 'ready' && missing.length === 0,
    dismissed,
    dismiss: () => setDismissed(true),
    recheck: () => {
      setDismissed(false);
      check();
    }
  };
};

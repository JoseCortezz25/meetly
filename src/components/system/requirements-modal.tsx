'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw, TriangleAlert, X } from 'lucide-react';
import {
  capabilityLabels,
  systemRequirementsMessages
} from '@/config/messages';
import type { CapabilityKey, SystemReport } from '@/lib/system-capabilities';

type RequirementsModalProps = {
  missing: CapabilityKey[];
  report: SystemReport | null;
  onContinue: () => void;
  onRecheck: () => void;
};

export const RequirementsModal = ({
  missing,
  report,
  onContinue,
  onRecheck
}: RequirementsModalProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const messages = systemRequirementsMessages;
  const info = report?.info;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onContinue();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onContinue]);

  const detected = [
    {
      label: messages.browserLabel,
      value: info?.browserName
        ? `${info.browserName} ${info.browserVersion}`.trim()
        : messages.unknown
    },
    {
      label: messages.gpuLabel,
      value: info?.gpu?.description || info?.gpu?.vendor || '—'
    },
    {
      label: messages.coresLabel,
      value: info?.hardwareConcurrency ? String(info.hardwareConcurrency) : '—'
    },
    {
      label: messages.memoryLabel,
      value: info?.deviceMemory ? messages.memoryValue(info.deviceMemory) : '—'
    }
  ];

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <button
        type="button"
        aria-label={messages.continueAnyway}
        onClick={onContinue}
        className="fixed inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="requirements-title"
        tabIndex={-1}
        className="border-line bg-ink-2 relative z-[1] my-auto w-full max-w-[520px] rounded-[18px] border p-5 shadow-2xl outline-none sm:p-7"
      >
        <div className="flex items-start gap-3.5">
          <span className="bg-mic/15 text-mic grid size-11 shrink-0 place-items-center rounded-full">
            <TriangleAlert className="size-5" />
          </span>
          <div>
            <h2
              id="requirements-title"
              className="font-display text-cream text-[22px] font-medium tracking-[-0.3px]"
            >
              {messages.title}
            </h2>
            <p className="text-sand mt-1.5 text-[14px] leading-[1.55]">
              {messages.description}
            </p>
          </div>
        </div>

        {missing.length > 0 && (
          <div className="mt-5">
            <p className="text-sand-2 mb-2 text-[11px] font-semibold tracking-[1px] uppercase">
              {messages.missingHeading}
            </p>
            <ul className="flex flex-col gap-1.5">
              {missing.map(key => (
                <li
                  key={key}
                  className="text-cream flex items-center gap-2.5 text-[14px]"
                >
                  <X className="text-mic size-[15px] shrink-0" />
                  {capabilityLabels[key]}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sand mt-5 text-[13px] leading-[1.55]">
          {messages.versionGuidance}
        </p>

        <div className="border-line mt-5 rounded-[12px] border p-4">
          <p className="text-sand-2 mb-2.5 text-[11px] font-semibold tracking-[1px] uppercase">
            {messages.detectedHeading}
          </p>
          <dl className="flex flex-col gap-1.5">
            {detected.map(row => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4"
              >
                <dt className="text-sand text-[13px]">{row.label}</dt>
                <dd className="text-cream truncate text-[13px] font-medium">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onRecheck}
            className="border-line-2 text-cream hover:bg-ink-3 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[13.5px] font-semibold transition-colors [&_svg]:size-[15px]"
          >
            <RotateCcw />
            {messages.recheck}
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="bg-cream text-ink rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition-transform duration-100 hover:-translate-y-0.5"
          >
            {messages.continueAnyway}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

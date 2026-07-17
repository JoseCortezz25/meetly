export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  /** Optional illustration path. A styled placeholder renders when omitted. */
  image?: string;
}

export const onboardingMessages = {
  stepProgress: (current: number, total: number) =>
    `Step ${current} of ${total}`,
  imagePlaceholder: 'Illustration coming soon',
  actions: {
    skip: 'Skip',
    back: 'Back',
    next: 'Next',
    getStarted: 'Get started'
  }
} as const;

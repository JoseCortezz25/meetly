'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, NotebookText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navMessages } from '@/config/messages';

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  isActive: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    href: '/',
    label: navMessages.home,
    icon: Home,
    isActive: path => path === '/'
  },
  {
    href: '/notes',
    label: navMessages.notes,
    icon: NotebookText,
    isActive: path => path.startsWith('/notes') || path.startsWith('/meeting')
  },
  {
    href: '/settings',
    label: navMessages.settings,
    icon: Settings,
    isActive: path => path.startsWith('/settings')
  }
];

export const TopNav = () => {
  const pathname = usePathname();

  return (
    <nav className="border-line bg-ink-2 inline-flex items-center gap-1 rounded-full border p-1.5">
      {navItems.map(item => {
        const active = item.isActive(pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-semibold transition-colors [&_svg]:size-[16px]',
              active ? 'bg-cream text-ink' : 'text-sand hover:text-cream'
            )}
          >
            <Icon />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

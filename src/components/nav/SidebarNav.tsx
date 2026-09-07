'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ScanEye, Users, ClipboardList,
  BarChart3, Shield, LogOut, Menu, X, Camera,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/brand/Logo'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  visible: boolean
}

type Props = {
  userRoles: string[]
  userEmail: string
}

function buildItems(userRoles: string[]): NavItem[] {
  const has = (r: string) => userRoles.includes('admin') || userRoles.includes(r)
  return [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard, visible: true },
    { href: '/dashboard/inventory', label: 'Inventory', icon: Package, visible: has('store_manager') },
    { href: '/dashboard/pos', label: 'Opticals', icon: ScanEye, visible: has('store_manager') || has('receptionist') },
    { href: '/dashboard/patients', label: 'Patients', icon: Users, visible: has('receptionist') || has('store_manager') || has('optician') },
    { href: '/dashboard/orders', label: 'Orders', icon: ClipboardList, visible: has('store_manager') || has('receptionist') || has('optician') },
    { href: '/dashboard/photo-stamp', label: 'Photo stamp', icon: Camera, visible: true },
    { href: '/dashboard/reports', label: 'Reports', icon: BarChart3, visible: has('accountant') },
    { href: '/dashboard/admin', label: 'Admin', icon: Shield, visible: has('admin') },
  ]
}

export function SidebarNav({ userRoles, userEmail }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const items = buildItems(userRoles).filter(i => i.visible)

  // Lock body scroll while drawer is open on mobile
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [mobileOpen])

  return (
    <>
      {/* Mobile top bar with hamburger — only below lg */}
      <div
        data-slot="mobile-topbar"
        className="glass sticky top-0 z-20 flex items-center justify-between px-4 py-3 lg:hidden"
      >
        <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
          <Logo size={28} />
          <span className="text-[14px] font-semibold tracking-tight text-ink-900">
            Sharma Eye Hospital
          </span>
        </Link>
        <button
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-white/80 text-ink-700 hover:bg-white"
        >
          <Menu size={18} strokeWidth={1.75} />
        </button>
      </div>

      {/* Backdrop — only when drawer open */}
      {mobileOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-ink-900/30 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Sidebar.
          - Mobile (< lg): fixed drawer that slides in from the left.
          - Desktop (≥ lg): in-flow grid item, sticky to viewport top.
            CSS Grid in the parent reserves a 244px column, so this stays
            predictable even if the position model misbehaves on a given
            browser (looking at you, Safari + backdrop-filter). */}
      <aside
        data-slot="sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[244px] flex-col transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-soft)]',
          'lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:transition-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        style={{ willChange: 'transform' }}
      >
        <div className="glass relative m-3 flex flex-1 flex-col rounded-2xl">
          {/* Brand lockup */}
          <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
            <div className="flex min-w-0 items-center gap-3">
              <Logo size={36} />
              <div className="leading-tight">
                <div className="text-[14px] font-semibold tracking-tight text-ink-900">
                  Sharma Eye
                </div>
                <div className="text-[12px] font-medium text-ink-500">Hospital</div>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 lg:hidden"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mx-5 h-px bg-hairline" />

          {/* Nav items */}
          <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
            {items.map(item => {
              const active =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-all',
                    'duration-[var(--duration-fast)] ease-[var(--ease-out-soft)]',
                    active
                      ? 'bg-brand-100/70 text-brand-700'
                      : 'text-ink-700 hover:bg-ink-100/70 hover:text-ink-900',
                  )}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-500"
                    />
                  )}
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.2 : 1.75}
                    className={cn(
                      'shrink-0 transition-colors',
                      active ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-700',
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User block */}
          <div className="border-t border-hairline px-3 py-3">
            <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[13px] font-semibold text-brand-700">
                {userEmail.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[13px] font-medium text-ink-800"
                  title={userEmail}
                >
                  {userEmail}
                </div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-ink-400">
                  {userRoles.includes('admin') ? 'Admin' : userRoles[0] ?? 'Staff'}
                </div>
              </div>
            </div>
            <form action="/auth/signout" method="post" className="mt-1.5">
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-500 transition-colors hover:bg-coral-50 hover:text-coral-700"
              >
                <LogOut size={16} strokeWidth={1.75} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  )
}

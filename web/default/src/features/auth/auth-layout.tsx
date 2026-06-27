/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Skeleton } from '@/components/ui/skeleton'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()

  return (
    <div className='relative flex min-h-svh items-center justify-center px-4 py-12'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 opacity-20 dark:opacity-[0.08]'
        style={{
          background: [
            'radial-gradient(ellipse 60% 50% at 20% 30%, oklch(0.72 0.18 250 / 70%) 0%, transparent 70%)',
            'radial-gradient(ellipse 50% 40% at 80% 20%, oklch(0.65 0.12 200 / 50%) 0%, transparent 70%)',
            'radial-gradient(ellipse 40% 35% at 50% 80%, oklch(0.70 0.12 280 / 30%) 0%, transparent 70%)',
          ].join(', '),
        }}
      />

      <div className='bg-card/80 border-border/50 relative w-full max-w-md rounded-2xl border p-8 shadow-xl backdrop-blur-xl'>
        <Link
          to='/'
          className='mb-8 flex flex-col items-center gap-3 transition-opacity hover:opacity-80'
        >
          <div className='relative h-12 w-12'>
            {loading ? (
              <Skeleton className='absolute inset-0 rounded-full' />
            ) : (
              <img
                src={logo}
                alt={t('Logo')}
                className='h-12 w-12 rounded-full object-cover shadow-md'
              />
            )}
          </div>
          {loading ? (
            <Skeleton className='h-6 w-28' />
          ) : (
            <h1 className='text-lg font-semibold tracking-tight'>
              {systemName}
            </h1>
          )}
        </Link>

        {children}
      </div>
    </div>
  )
}

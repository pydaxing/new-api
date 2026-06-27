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
    <div className='flex min-h-svh'>
      {/* Left Panel - Sci-fi AI animation */}
      <div className='relative hidden w-[45%] items-center justify-center overflow-hidden bg-[#050510] lg:flex'>
        {/* Animated grid background */}
        <div className='auth-grid pointer-events-none absolute inset-0' />

        {/* Radial glow effects */}
        <div className='pointer-events-none absolute inset-0'>
          <div className='auth-glow-1 absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full' />
          <div className='auth-glow-2 absolute left-[30%] top-[30%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full' />
          <div className='auth-glow-3 absolute bottom-[20%] right-[20%] h-[250px] w-[250px] rounded-full' />
        </div>

        {/* Orbiting rings */}
        <div className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
          <div className='auth-orbit-1 h-[280px] w-[280px] rounded-full border border-white/[0.06]' />
        </div>
        <div className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
          <div className='auth-orbit-2 h-[400px] w-[400px] rounded-full border border-white/[0.04]' />
        </div>
        <div className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
          <div className='auth-orbit-3 h-[520px] w-[520px] rounded-full border border-dashed border-white/[0.03]' />
        </div>

        {/* Floating particles */}
        <div className='pointer-events-none absolute inset-0'>
          <div className='auth-particle absolute left-[20%] top-[15%] h-1 w-1 rounded-full bg-cyan-400/60' style={{ animationDelay: '0s', animationDuration: '6s' }} />
          <div className='auth-particle absolute left-[70%] top-[20%] h-1.5 w-1.5 rounded-full bg-purple-400/50' style={{ animationDelay: '1s', animationDuration: '8s' }} />
          <div className='auth-particle absolute left-[40%] top-[60%] h-1 w-1 rounded-full bg-blue-400/60' style={{ animationDelay: '2s', animationDuration: '7s' }} />
          <div className='auth-particle absolute left-[80%] top-[50%] h-0.5 w-0.5 rounded-full bg-cyan-300/70' style={{ animationDelay: '0.5s', animationDuration: '5s' }} />
          <div className='auth-particle absolute left-[15%] top-[75%] h-1 w-1 rounded-full bg-indigo-400/50' style={{ animationDelay: '3s', animationDuration: '9s' }} />
          <div className='auth-particle absolute left-[55%] top-[85%] h-1.5 w-1.5 rounded-full bg-violet-400/40' style={{ animationDelay: '1.5s', animationDuration: '6.5s' }} />
          <div className='auth-particle absolute left-[85%] top-[80%] h-1 w-1 rounded-full bg-cyan-400/50' style={{ animationDelay: '4s', animationDuration: '7.5s' }} />
          <div className='auth-particle absolute left-[30%] top-[35%] h-0.5 w-0.5 rounded-full bg-blue-300/60' style={{ animationDelay: '2.5s', animationDuration: '8.5s' }} />
          <div className='auth-particle absolute left-[60%] top-[40%] h-1 w-1 rounded-full bg-purple-300/40' style={{ animationDelay: '0.8s', animationDuration: '6.2s' }} />
          <div className='auth-particle absolute left-[45%] top-[10%] h-0.5 w-0.5 rounded-full bg-cyan-200/50' style={{ animationDelay: '3.5s', animationDuration: '5.5s' }} />
        </div>

        {/* Scanning line */}
        <div className='auth-scan-line pointer-events-none absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent' />

        {/* Brand */}
        <div className='relative z-10 text-center'>
          {loading ? (
            <Skeleton className='mx-auto mb-4 h-16 w-16 rounded-full' />
          ) : (
            <div className='auth-logo-glow relative mx-auto mb-4 h-16 w-16'>
              <img
                src={logo}
                alt={t('Logo')}
                className='relative z-10 h-16 w-16 rounded-full object-cover'
              />
            </div>
          )}
          {loading ? (
            <Skeleton className='mx-auto mb-2 h-7 w-32' />
          ) : (
            <h1 className='mb-2 text-xl font-semibold tracking-tight text-white/90'>
              {systemName}
            </h1>
          )}
          <p className='text-sm text-white/30'>{t('Unified AI Gateway')}</p>
        </div>
      </div>

      {/* Right Panel - Form area */}
      <div className='bg-background flex flex-1 items-center justify-center px-6 py-12'>
        <div className='w-full max-w-[400px]'>
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
                  className='h-12 w-12 rounded-full object-cover shadow-sm'
                />
              )}
            </div>
            {loading ? (
              <Skeleton className='h-5 w-24' />
            ) : (
              <span className='text-sm font-semibold tracking-tight'>
                {systemName}
              </span>
            )}
          </Link>

          {children}
        </div>
      </div>
    </div>
  )
}

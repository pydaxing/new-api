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
    <div className='bg-background flex min-h-svh items-center justify-center px-6 py-12'>
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
  )
}

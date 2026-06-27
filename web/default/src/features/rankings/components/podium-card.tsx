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
import type { ReactNode } from 'react'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PodiumItem {
  name: string
  icon?: ReactNode
  value: string
  subtitle?: string
}

interface PodiumCardProps {
  title: string
  items: PodiumItem[]
}

const podiumConfig = [
  { order: 1, label: '2nd', height: 'pt-8', barHeight: 'h-16', barColor: 'bg-muted-foreground/10', textColor: 'text-muted-foreground' },
  { order: 0, label: '1st', height: 'pt-0', barHeight: 'h-24', barColor: 'bg-amber-500/15 dark:bg-amber-500/10', textColor: 'text-amber-600 dark:text-amber-400' },
  { order: 2, label: '3rd', height: 'pt-12', barHeight: 'h-12', barColor: 'bg-muted-foreground/5', textColor: 'text-muted-foreground' },
]

export function PodiumCard({ title, items }: PodiumCardProps) {
  if (items.length === 0) return null

  const ordered = [items[1], items[0], items[2]].filter(Boolean)

  return (
    <div className='bg-card overflow-hidden rounded-xl border'>
      <div className='flex items-center gap-2 border-b px-4 py-3 sm:px-5 sm:py-4'>
        <Trophy className='text-amber-500 h-4 w-4' />
        <h3 className='text-foreground text-sm font-semibold'>{title}</h3>
      </div>
      <div className='px-4 py-6 sm:px-6 sm:py-8'>
        <div className='mx-auto grid max-w-md grid-cols-3 items-end gap-3'>
          {ordered.map((item, idx) => {
            const config = podiumConfig[idx]
            if (!item) return <div key={idx} />
            return (
              <div
                key={item.name}
                className={cn('flex flex-col items-center gap-2', config.height)}
              >
                <div className='flex h-12 w-12 items-center justify-center sm:h-14 sm:w-14'>
                  {item.icon}
                </div>
                <p className='text-foreground max-w-full truncate text-center text-xs font-semibold sm:text-sm'>
                  {item.name}
                </p>
                {item.subtitle && (
                  <p className='text-muted-foreground max-w-full truncate text-center text-[11px]'>
                    {item.subtitle}
                  </p>
                )}
                <div
                  className={cn(
                    'flex w-full flex-col items-center justify-end rounded-t-lg',
                    config.barHeight,
                    config.barColor
                  )}
                >
                  <span className={cn('font-mono text-xs font-bold', config.textColor)}>
                    {item.value}
                  </span>
                  <span className={cn('text-[10px]', config.textColor)}>
                    #{config.order === 0 ? '1' : config.order === 1 ? '2' : '3'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

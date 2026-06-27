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
import { Star } from 'lucide-react'
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

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
    </svg>
  )
}

const podiumStyles = [
  {
    avatarSize: 'h-12 w-12',
    crownSize: 'h-5 w-5',
    crownOffset: '-top-5',
    crownColor: 'text-slate-400',
    ringClass: 'bg-gradient-to-br from-slate-300 via-slate-100 to-slate-400',
    podiumH: 'h-20',
    podiumBg: 'bg-gradient-to-t from-slate-300 via-slate-200 to-slate-100',
    valueColor: 'text-slate-600',
    subColor: 'text-slate-500',
    nameClass: 'text-[11px] font-semibold',
    animDelay: '0.3s',
    podiumRiseClass: 'podium-rise podium-rise-delay-1',
    avatarPopClass: 'avatar-pop avatar-pop-delay-2',
  },
  {
    avatarSize: 'h-16 w-16',
    crownSize: 'h-6 w-6',
    crownOffset: '-top-6',
    crownColor: 'text-amber-400',
    ringClass: 'gold-ring-gradient',
    podiumH: 'h-28',
    podiumBg: 'bg-gradient-to-t from-amber-300 via-amber-200 to-amber-50',
    valueColor: 'text-amber-700',
    subColor: 'text-amber-600',
    nameClass: 'text-sm font-bold',
    animDelay: '0s',
    podiumRiseClass: 'podium-rise',
    avatarPopClass: 'avatar-pop avatar-pop-delay-1',
  },
  {
    avatarSize: 'h-11 w-11',
    crownSize: 'h-5 w-5',
    crownOffset: '-top-5',
    crownColor: 'text-orange-400',
    ringClass: 'bg-gradient-to-br from-orange-300 via-orange-100 to-orange-400',
    podiumH: 'h-14',
    podiumBg: 'bg-gradient-to-t from-orange-200 via-orange-100 to-orange-50',
    valueColor: 'text-orange-600',
    subColor: 'text-orange-500',
    nameClass: 'text-[11px] font-semibold',
    animDelay: '0.6s',
    podiumRiseClass: 'podium-rise podium-rise-delay-2',
    avatarPopClass: 'avatar-pop avatar-pop-delay-3',
  },
]

export function PodiumCard({ title, items }: PodiumCardProps) {
  if (items.length === 0) return null

  const ordered = [items[1], items[0], items[2]].filter(Boolean)

  return (
    <div className='bg-card overflow-hidden rounded-xl border'>
      <div className='flex items-center gap-2 border-b px-4 py-3 sm:px-5 sm:py-3.5'>
        <Star className='h-4 w-4 text-amber-500' />
        <h3 className='text-foreground text-sm font-semibold'>{title}</h3>
      </div>

      <div className='podium-container relative px-4 pt-8 pb-0 sm:px-6'>
        <div className='pointer-events-none absolute inset-0 overflow-hidden'>
          <div className='absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/3 rounded-full bg-amber-400/10 blur-3xl' />
        </div>

        <div className='relative flex items-end justify-center gap-3 sm:gap-5'>
          {ordered.map((item, idx) => {
            if (!item) return <div key={idx} className='flex-1' />
            const style = podiumStyles[idx]
            const isFirst = idx === 1
            return (
              <div key={item.name} className='flex flex-1 flex-col items-center'>
                {/* Avatar with crown */}
                <div className={cn('relative mb-3', style.avatarPopClass)}>
                  {/* Crown */}
                  <div
                    className={cn('crown-float absolute left-1/2 z-10', style.crownOffset)}
                    style={{ animationDelay: style.animDelay }}
                  >
                    <CrownIcon className={cn(style.crownSize, style.crownColor, 'drop-shadow')} />
                  </div>

                  {/* Gradient ring */}
                  {isFirst ? (
                    <>
                      <div className={cn('ring-spin absolute -inset-1.5 rounded-full opacity-60', style.ringClass)} />
                      <div className='sparkle-1 absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-300' />
                      <div className='sparkle-2 absolute -bottom-0.5 -left-1.5 h-1.5 w-1.5 rounded-full bg-amber-400' />
                      <div className='sparkle-3 absolute top-1 -left-2 h-1 w-1 rounded-full bg-yellow-300' />
                    </>
                  ) : (
                    <div className={cn('absolute -inset-1 rounded-full opacity-80', style.ringClass)} />
                  )}

                  {/* Avatar */}
                  <div className={cn(
                    'relative flex items-center justify-center rounded-full bg-white shadow-md',
                    style.avatarSize,
                    isFirst ? 'shadow-lg shadow-amber-200/50' : ''
                  )}>
                    {item.icon}
                  </div>
                </div>

                {/* Name */}
                <p className={cn('text-foreground mb-0.5 max-w-full truncate text-center', style.nameClass)}>
                  {item.name}
                </p>
                {item.subtitle && (
                  <p className='text-muted-foreground mb-2 max-w-full truncate text-center text-[10px] sm:text-[11px]'>
                    {item.subtitle}
                  </p>
                )}

                {/* Podium bar */}
                <div className={cn(
                  'flex w-full flex-col items-center justify-center rounded-t-xl shadow-inner',
                  style.podiumH,
                  style.podiumBg,
                  style.podiumRiseClass
                )}>
                  <span className={cn('font-mono text-xs font-bold sm:text-sm', style.valueColor)}>
                    {item.value}
                  </span>
                  <span className={cn('mt-0.5 text-[9px] sm:text-[10px]', style.subColor)}>
                    tokens
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        .podium-container .crown-float {
          animation: podium-crown-float 2s ease-in-out infinite;
        }
        .podium-container .ring-spin {
          animation: podium-ring-rotate 6s linear infinite;
        }
        .podium-container .sparkle-1 { animation: podium-sparkle 2s ease-in-out infinite; }
        .podium-container .sparkle-2 { animation: podium-sparkle 2s ease-in-out 0.5s infinite; }
        .podium-container .sparkle-3 { animation: podium-sparkle 2s ease-in-out 1s infinite; }
        .podium-container .podium-rise {
          animation: podium-bar-rise 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: bottom;
        }
        .podium-container .podium-rise-delay-1 { animation-delay: 0.2s; opacity: 0; }
        .podium-container .podium-rise-delay-2 { animation-delay: 0.4s; opacity: 0; }
        .podium-container .avatar-pop {
          animation: podium-avatar-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .podium-container .avatar-pop-delay-1 { animation-delay: 0.6s; opacity: 0; }
        .podium-container .avatar-pop-delay-2 { animation-delay: 0.8s; opacity: 0; }
        .podium-container .avatar-pop-delay-3 { animation-delay: 1s; opacity: 0; }
        .podium-container .gold-ring-gradient {
          background: conic-gradient(from 0deg, #fbbf24, #f59e0b, #d97706, #fbbf24);
        }

        @keyframes podium-crown-float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-3px); }
        }
        @keyframes podium-ring-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes podium-sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes podium-bar-rise {
          from { transform: scaleY(0); opacity: 0; }
          to { transform: scaleY(1); opacity: 1; }
        }
        @keyframes podium-avatar-pop {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

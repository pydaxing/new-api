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
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { docsStructure } from '../content'

type DocsSidebarProps = {
  activeSlug: string
  onSelect: (slug: string) => void
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
}

export function DocsSidebar({
  activeSlug,
  onSelect,
  mobileOpen,
  onMobileOpenChange,
}: DocsSidebarProps) {
  return (
    <>
      {/* Mobile toggle */}
      <div className='fixed top-16 left-4 z-30 md:hidden'>
        <Button
          variant='outline'
          size='sm'
          className='mt-2'
          onClick={() => onMobileOpenChange(!mobileOpen)}
        >
          <Menu className='size-4' />
          <span className='ml-1.5 text-xs'>目录</span>
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className='bg-background/80 fixed inset-0 z-20 backdrop-blur-sm md:hidden'
          onClick={() => onMobileOpenChange(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'border-border bg-background fixed top-16 left-0 z-20 h-[calc(100svh-4rem)] w-64 shrink-0 overflow-y-auto border-r p-4 transition-transform md:sticky md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className='space-y-4'>
          {docsStructure.map((category) => (
            <div key={category.title}>
              <h3 className='text-muted-foreground mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider'>
                {category.title}
              </h3>
              <ul className='space-y-0.5'>
                {category.items.map((item) => (
                  <li key={item.slug}>
                    <button
                      onClick={() => onSelect(item.slug)}
                      className={cn(
                        'w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                        activeSlug === item.slug
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}

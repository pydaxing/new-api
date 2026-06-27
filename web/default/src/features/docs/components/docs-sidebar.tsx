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
import { Menu, ChevronRight, BookOpen, Server, MessageSquare, Shield, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { docsStructure } from '../content'

type DocsSidebarProps = {
  activeSlug: string
  onSelect: (slug: string) => void
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
}

const categoryIcons: Record<string, React.ReactNode> = {
  '使用教程': <BookOpen className='size-4' />,
  '模型信息': <Server className='size-4' />,
  '聊天模型（Chat）': <MessageSquare className='size-4' />,
  '内容审查': <Shield className='size-4' />,
  '向量嵌入': <Database className='size-4' />,
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
          className='mt-2 shadow-sm'
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
          'border-border bg-background fixed top-16 left-0 z-20 h-[calc(100svh-4rem)] w-72 shrink-0 overflow-y-auto border-r transition-transform md:sticky md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className='p-4'>
          <h2 className='text-foreground mb-4 px-3 text-sm font-bold'>API 文档</h2>
          <nav className='space-y-5'>
            {docsStructure.map((category) => {
              const isActiveCategory = category.items.some(
                (item) => item.slug === activeSlug
              )
              return (
                <div key={category.title}>
                  <div
                    className={cn(
                      'mb-1 flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider',
                      isActiveCategory
                        ? 'text-primary bg-primary/5'
                        : 'text-muted-foreground'
                    )}
                  >
                    {categoryIcons[category.title]}
                    <span>{category.title}</span>
                  </div>
                  <ul className='border-border ml-2 space-y-0.5 border-l pl-3'>
                    {category.items.map((item) => (
                      <li key={item.slug}>
                        <button
                          onClick={() => onSelect(item.slug)}
                          className={cn(
                            'group relative flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors',
                            activeSlug === item.slug
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                          )}
                        >
                          {activeSlug === item.slug && (
                            <ChevronRight className='text-primary absolute -left-[15px] size-3' />
                          )}
                          <span className='truncate'>{item.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}

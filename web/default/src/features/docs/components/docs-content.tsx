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
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Markdown } from '@/components/ui/markdown'
import { findDocBySlug } from '../content'

type DocsContentProps = {
  slug: string
}

export function DocsContent({ slug }: DocsContentProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const doc = findDocBySlug(slug)
    if (!doc) {
      setError('文档不存在')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    fetch(`/api-docs/${doc.item.file}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then((text) => {
        setContent(text)
        setLoading(false)
      })
      .catch((err) => {
        setError(`加载失败: ${err.message}`)
        setLoading(false)
      })
  }, [slug])

  if (error) {
    return (
      <main className='flex-1 px-6 py-8 md:px-12'>
        <div className='text-destructive rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950'>
          {error}
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className='flex-1 space-y-4 px-6 py-8 md:px-12'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-3/4' />
        <Skeleton className='h-32 w-full' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-1/2' />
      </main>
    )
  }

  return (
    <main className='min-w-0 flex-1 px-6 py-8 md:px-12'>
      <article className='max-w-3xl'>
        <Markdown>{content}</Markdown>
      </article>
    </main>
  )
}

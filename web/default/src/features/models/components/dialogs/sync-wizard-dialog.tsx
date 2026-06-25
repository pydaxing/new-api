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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog } from '@/components/dialog'
import { getUpstreamChannels } from '@/features/system-settings/api'
import {
  syncUpstream,
  previewUpstreamDiff,
  syncFromChannels,
} from '../../api'
import { getSyncSourceOptions } from '../../constants'
import { modelsQueryKeys, vendorsQueryKeys } from '../../lib'
import type { SyncSource } from '../../types'
import { useModels } from '../models-provider'

type SyncWizardDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SyncWizardDialog({
  open,
  onOpenChange,
}: SyncWizardDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const {
    setOpen,
    setUpstreamConflicts,
    setSyncWizardOptions,
    syncWizardOptions,
  } = useModels()
  const isMobile = useIsMobile()
  const [source, setSource] = useState<SyncSource>('official')
  const [isSyncing, setIsSyncing] = useState(false)
  const [selectedChannelIds, setSelectedChannelIds] = useState<number[]>([])

  const SYNC_SOURCE_OPTIONS = getSyncSourceOptions(t)

  // Fetch available channels when source is 'channels'
  const { data: channelsData } = useQuery({
    queryKey: ['upstream-channels'],
    queryFn: getUpstreamChannels,
    enabled: open && source === 'channels',
  })
  const channels = (channelsData?.data ?? []).filter((ch) => ch.id > 0)

  useEffect(() => {
    if (open) {
      const preferredSource = SYNC_SOURCE_OPTIONS.find(
        (option) => option.value === syncWizardOptions.source
      )
      setSource(
        preferredSource && !preferredSource.disabled
          ? (preferredSource.value as SyncSource)
          : 'official'
      )
      setSelectedChannelIds([])
    }
  }, [open, syncWizardOptions, SYNC_SOURCE_OPTIONS])

  const handleSync = async () => {
    if (source === 'channels') {
      if (selectedChannelIds.length === 0) {
        toast.warning(t('Please select at least one channel'))
        return
      }
      setIsSyncing(true)
      try {
        const response = await syncFromChannels(selectedChannelIds)
        if (response.success) {
          const { created_models, total_fetched } = response.data || {}
          toast.success(
            t('Import completed! Created {{created}} models from {{total}} fetched.', {
              created: created_models || 0,
              total: total_fetched || 0,
            })
          )
          queryClient.invalidateQueries({ queryKey: modelsQueryKeys.lists() })
          queryClient.invalidateQueries({ queryKey: vendorsQueryKeys.lists() })
          onOpenChange(false)
        } else {
          toast.error(response.message || t('Import failed'))
        }
      } catch (error: unknown) {
        toast.error((error as Error)?.message || t('Import failed'))
      } finally {
        setIsSyncing(false)
      }
      return
    }

    setIsSyncing(true)
    try {
      setSyncWizardOptions({ locale: 'zh', source })
      const previewRes = await previewUpstreamDiff({ locale: 'zh', source })

      if (!previewRes.success) {
        throw new Error(previewRes.message || 'Failed to preview upstream diff')
      }

      const conflicts = previewRes.data?.conflicts || []

      if (conflicts.length > 0) {
        toast.warning(
          `Found ${conflicts.length} conflict${conflicts.length > 1 ? 's' : ''}. Please resolve them first.`
        )
        setUpstreamConflicts(conflicts)
        setOpen('upstream-conflict')
        return
      }

      // No conflicts, proceed with sync
      const response = await syncUpstream({ locale: 'zh', source })

      if (response.success) {
        const { created_models, created_vendors, updated_models } =
          response.data || {}
        toast.success(
          `Sync completed! Created ${created_models || 0} models, updated ${updated_models || 0}, and added ${created_vendors || 0} vendors.`
        )
        queryClient.invalidateQueries({ queryKey: modelsQueryKeys.lists() })
        queryClient.invalidateQueries({ queryKey: vendorsQueryKeys.lists() })
        onOpenChange(false)
      } else {
        toast.error(response.message || 'Sync failed')
      }
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('Sync Upstream Models')}
      description={t('Synchronize models and vendors from an upstream source')}
      initialFocus={!isMobile}
      contentHeight='auto'
      bodyClassName='flex flex-col gap-6'
      footer={
        <>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSyncing}
          >
            {t('Cancel')}
          </Button>
          <Button onClick={handleSync} disabled={isSyncing}>
            {isSyncing && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            <RefreshCw className='mr-2 h-4 w-4' />
            {isSyncing ? t('Syncing...') : t('Sync Now')}
          </Button>
        </>
      }
    >
      <div className='space-y-3'>
        <div>
          <Label className='text-base'>{t('Select Sync Source')}</Label>
          <p className='text-muted-foreground text-sm'>
            {t('Choose where to fetch upstream metadata.')}
          </p>
        </div>
        <RadioGroup
          value={source}
          onValueChange={(value) => setSource(value as SyncSource)}
          className='grid gap-3 md:grid-cols-2'
        >
          {SYNC_SOURCE_OPTIONS.map((option) => {
            const isActive = source === option.value
            return (
              <Label
                key={option.value}
                htmlFor={`sync-source-${option.value}`}
                className={cn(
                  'flex-col items-start gap-0 rounded-lg border p-4 font-normal transition-all',
                  isActive && 'border-primary ring-primary ring-1',
                  'hover:border-primary/60 cursor-pointer'
                )}
              >
                <div className='flex items-start gap-3'>
                  <RadioGroupItem
                    value={option.value}
                    id={`sync-source-${option.value}`}
                  />
                  <div className='space-y-1'>
                    <span className='font-medium'>{option.label}</span>
                    <p className='text-muted-foreground text-sm'>
                      {option.description}
                    </p>
                  </div>
                </div>
              </Label>
            )
          })}
        </RadioGroup>
      </div>

      {source === 'channels' && (
        <div className='space-y-3'>
          <div>
            <Label className='text-base'>选择渠道</Label>
            <p className='text-muted-foreground text-sm'>
              选择要从哪些渠道导入模型信息
            </p>
          </div>
          <div className='max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3'>
            {channels.length === 0 ? (
              <p className='text-muted-foreground text-sm'>加载渠道列表中...</p>
            ) : (
              channels.map((ch) => (
                <label
                  key={ch.id}
                  className='flex cursor-pointer items-center gap-2 rounded p-1.5 hover:bg-muted/50'
                >
                  <Checkbox
                    checked={selectedChannelIds.includes(ch.id)}
                    onCheckedChange={(checked) => {
                      setSelectedChannelIds((prev) =>
                        checked
                          ? [...prev, ch.id]
                          : prev.filter((id) => id !== ch.id)
                      )
                    }}
                  />
                  <span className='text-sm'>{ch.name}</span>
                  <span className='text-muted-foreground text-xs'>({ch.base_url})</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      <div className='bg-muted/50 rounded-lg border p-4'>
        <p className='text-muted-foreground text-sm'>
          {source === 'channels'
            ? '将从渠道的定价接口获取模型信息，尚未录入的模型会自动创建（含描述、供应商、标签）。'
            : '将从上游仓库同步缺失的模型和供应商信息，已有记录仅在你确认冲突时更新。'}
        </p>
      </div>
    </Dialog>
  )
}

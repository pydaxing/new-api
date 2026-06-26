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
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { ArrowLeft, HeartPulse, Timer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { CopyButton } from '@/components/copy-button'
import { sideDrawerContentClassName } from '@/components/drawer-layout'
import { GroupBadge } from '@/components/group-badge'
import { PublicLayout } from '@/components/layout'
import { getPerfMetrics } from '@/features/performance-metrics/api'
import {
  formatLatency,
  formatThroughput,
  formatUptimePct,
  getSuccessRateTextClass,
} from '@/features/performance-metrics/lib/format'
import { ENDPOINT_DISPLAY_NAMES } from '@/features/models/constants'
import { DEFAULT_TOKEN_UNIT, QUOTA_TYPE_VALUES } from '../constants'
import { usePricingData } from '../hooks/use-pricing-data'
import {
  getDynamicPriceEntries,
  getDynamicPricingSummary,
  getDynamicPricingTiers,
  isDynamicPricingModel,
} from '../lib/dynamic-price'
import { getAvailableGroups, isTokenBasedModel } from '../lib/model-helpers'
import { formatFixedPrice, formatGroupPrice } from '../lib/price'
import type { PriceType, PricingModel, TokenUnit } from '../types'

// ----------------------------------------------------------------------------
// Local UI helpers
// ----------------------------------------------------------------------------

function formatRatioLabel(ratio: number): string {
  if (ratio === 1) return '原价'
  const discount = ratio * 10
  const formatted =
    discount === Math.floor(discount)
      ? String(Math.floor(discount))
      : discount.toFixed(1)
  return `${formatted}折`
}


function OverviewMetric(props: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  valueClassName?: string
}) {
  const Icon = props.icon

  return (
    <div className='flex min-w-0 items-center gap-2 px-3 py-2'>
      <Icon className='text-muted-foreground/70 size-3.5 shrink-0' />
      <div className='min-w-0 flex-1'>
        <div className='text-muted-foreground truncate text-[10px] font-medium tracking-wider uppercase'>
          {props.label}
        </div>
        <div
          className={cn(
            'text-foreground truncate font-mono text-sm font-semibold tabular-nums',
            props.valueClassName
          )}
        >
          {props.value}
        </div>
      </div>
    </div>
  )
}

function OverviewSummaryGrid(props: { model: PricingModel }) {
  const { t } = useTranslation()
  const metricsQuery = useQuery({
    queryKey: ['perf-metrics', props.model.model_name],
    queryFn: () => getPerfMetrics(props.model.model_name, 24),
    staleTime: 60 * 1000,
  })

  const groups = metricsQuery.data?.data.groups ?? []
  const successRates = groups
    .map((group) => group.success_rate)
    .filter((rate) => Number.isFinite(rate))
  const successRate =
    successRates.length > 0
      ? successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length
      : Number.NaN
  const tpsValues = groups
    .map((group) => group.avg_tps)
    .filter((value) => value > 0)
  const avgTps =
    tpsValues.length > 0
      ? tpsValues.reduce((sum, value) => sum + value, 0) / tpsValues.length
      : 0
  const latencyValues = groups
    .map((group) => group.avg_latency_ms)
    .filter((value) => value > 0)
  const avgLatency =
    latencyValues.length > 0
      ? Math.round(
          latencyValues.reduce((sum, value) => sum + value, 0) /
            latencyValues.length
        )
      : 0

  return (
    <div className='bg-muted/20 grid overflow-hidden rounded-lg border sm:grid-cols-3 sm:divide-x'>
      <OverviewMetric
        icon={Timer}
        label='TPS'
        value={formatThroughput(avgTps)}
      />
      <OverviewMetric
        icon={Timer}
        label={t('Average latency')}
        value={formatLatency(avgLatency)}
      />
      <OverviewMetric
        icon={HeartPulse}
        label={t('Success rate')}
        value={formatUptimePct(successRate)}
        valueClassName={getSuccessRateTextClass(successRate)}
      />
    </div>
  )
}

// ----------------------------------------------------------------------------
// Model header (always visible above the detail sections)
// ----------------------------------------------------------------------------

function ModelHeader(props: { model: PricingModel }) {
  const { t } = useTranslation()
  const model = props.model
  const modelIconKey = model.icon || model.vendor_icon
  const modelIcon = modelIconKey ? getLobeIcon(modelIconKey, 20) : null
  const isSpecialExpression =
    model.billing_mode === 'tiered_expr' &&
    Boolean(model.billing_expr) &&
    getDynamicPricingTiers(model).length === 0

  return (
    <header className='pb-4'>
      <div className='flex items-center gap-2.5'>
        {modelIcon}
        <h1 className='font-mono text-xl font-bold tracking-tight sm:text-2xl'>
          {model.model_name}
        </h1>
        <CopyButton
          value={model.model_name || ''}
          className='size-6'
          iconClassName='size-3'
          tooltip={t('Copy model name')}
          successTooltip={t('Copied!')}
          aria-label={t('Copy model name')}
        />
      </div>
      <div className='mt-1 flex flex-wrap items-center gap-1.5 text-xs'>
        {model.vendor_name && (
          <span className='text-muted-foreground'>{model.vendor_name}</span>
        )}
        <span className='text-muted-foreground/30'>·</span>
        <span className='text-muted-foreground/70'>
          {model.quota_type === QUOTA_TYPE_VALUES.TOKEN
            ? t('Token-based')
            : t('Per Request')}
        </span>
        {model.billing_mode === 'tiered_expr' && model.billing_expr && (
          <>
            <span className='text-muted-foreground/30'>·</span>
            <span className='rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'>
              {isSpecialExpression
                ? t('Special billing expression')
                : t('Dynamic Pricing')}
            </span>
          </>
        )}
      </div>
    </header>
  )
}

// ----------------------------------------------------------------------------
// Base price card (used in the Overview tab)
// ----------------------------------------------------------------------------

function PriceSection(props: {
  model: PricingModel
  priceRate: number
  usdExchangeRate: number
  tokenUnit: TokenUnit
  showRechargePrice: boolean
}) {
  const { t } = useTranslation()
  const isTokenBased = isTokenBasedModel(props.model)
  const baseGroupKey = '_base'
  const baseGroupRatioMap = { [baseGroupKey]: 1 }
  const dynamicSummary = getDynamicPricingSummary(props.model, {
    tokenUnit: props.tokenUnit,
    showRechargePrice: props.showRechargePrice,
    priceRate: props.priceRate,
    usdExchangeRate: props.usdExchangeRate,
    groupRatioMultiplier: 1,
  })

  const secondaryPriceTypes: {
    label: string
    type: PriceType
    available: boolean
  }[] = [
    {
      label: t('Cache'),
      type: 'cache',
      available: props.model.cache_ratio != null,
    },
    {
      label: t('Cache Write'),
      type: 'create_cache',
      available: props.model.create_cache_ratio != null,
    },
    {
      label: t('Image'),
      type: 'image',
      available: props.model.image_ratio != null,
    },
    {
      label: t('Audio In'),
      type: 'audio_input',
      available: props.model.audio_ratio != null,
    },
    {
      label: t('Audio Out'),
      type: 'audio_output',
      available:
        props.model.audio_ratio != null &&
        props.model.audio_completion_ratio != null,
    },
  ]

  const secondaryItems = secondaryPriceTypes.filter((p) => p.available)

  const renderBasePrice = (type: PriceType) =>
    formatGroupPrice(
      props.model,
      baseGroupKey,
      type,
      props.tokenUnit,
      props.showRechargePrice,
      props.priceRate,
      props.usdExchangeRate,
      baseGroupRatioMap
    )

  if (dynamicSummary) {
    if (dynamicSummary.isSpecialExpression) {
      return (
        <div className='rounded-lg border border-amber-200/70 bg-amber-50/70 p-3 dark:border-amber-500/20 dark:bg-amber-500/10'>
          <div className='text-sm font-medium text-amber-800 dark:text-amber-200'>
            {t('Special billing expression')}
          </div>
          <p className='text-muted-foreground mt-1 text-xs'>
            {t('Unable to parse structured pricing')}
          </p>
          <div className='mt-3'>
            <div className='text-muted-foreground mb-1 text-[10px] font-medium tracking-wider uppercase'>
              {t('Raw expression')}
            </div>
            <code className='text-muted-foreground bg-background/80 block max-h-28 overflow-auto rounded-md border px-2 py-1.5 font-mono text-xs break-all'>
              {dynamicSummary.rawExpression}
            </code>
          </div>
        </div>
      )
    }

    const dynTokenUnitDisplay =
      props.tokenUnit === 'K' ? '1K Tokens' : '1M Tokens'

    return (
      <div className='space-y-3'>
        {dynamicSummary.primaryEntries.length > 0 ? (
          <div className='grid grid-cols-2 gap-3'>
            {dynamicSummary.primaryEntries.map((entry) => (
              <div key={entry.key} className='bg-muted/30 rounded-lg p-5'>
                <div className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                  {t(entry.shortLabel)}
                </div>
                <div className='mt-2 flex items-baseline justify-between'>
                  <div className='text-foreground font-mono text-2xl font-bold tabular-nums'>
                    {entry.formatted}
                  </div>
                  <div className='text-muted-foreground/60 text-base font-medium'>
                    {dynTokenUnitDisplay}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-muted-foreground text-sm'>
            {t('Dynamic Pricing')}
          </p>
        )}
        {dynamicSummary.secondaryEntries.length > 0 && (
          <div className='grid grid-cols-3 gap-2'>
            {dynamicSummary.secondaryEntries.map((entry) => (
              <div key={entry.key} className='bg-muted/30 rounded-lg px-4 py-3'>
                <div className='text-muted-foreground text-[11px]'>
                  {t(entry.shortLabel)}
                </div>
                <div className='mt-1 flex items-baseline justify-between'>
                  <div className='text-foreground font-mono text-base font-bold tabular-nums'>
                    {entry.formatted}
                  </div>
                  <div className='text-muted-foreground/50 text-xs'>
                    {dynTokenUnitDisplay}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!isTokenBased) {
    return (
      <div className='bg-muted/30 rounded-lg p-5'>
        <div className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
          {t('Per Request')}
        </div>
        <div className='mt-2 flex items-baseline justify-between'>
          <div className='text-foreground font-mono text-2xl font-bold tabular-nums'>
            {formatFixedPrice(
              props.model,
              baseGroupKey,
              props.showRechargePrice,
              props.priceRate,
              props.usdExchangeRate,
              baseGroupRatioMap
            )}
          </div>
          <div className='text-muted-foreground/60 text-base font-medium'>
            {t('次')}
          </div>
        </div>
      </div>
    )
  }

  const tokenUnitDisplay =
    props.tokenUnit === 'K' ? '1K Tokens' : '1M Tokens'

  return (
    <div className='space-y-3'>
      <div className='grid grid-cols-2 gap-3'>
        <div className='bg-muted/30 rounded-lg p-5'>
          <div className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
            {t('Input')}
          </div>
          <div className='mt-2 flex items-baseline justify-between'>
            <div className='text-foreground font-mono text-2xl font-bold tabular-nums'>
              {renderBasePrice('input')}
            </div>
            <div className='text-muted-foreground/60 text-base font-medium'>
              {tokenUnitDisplay}
            </div>
          </div>
        </div>
        <div className='bg-muted/30 rounded-lg p-5'>
          <div className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
            {t('Output')}
          </div>
          <div className='mt-2 flex items-baseline justify-between'>
            <div className='text-foreground font-mono text-2xl font-bold tabular-nums'>
              {renderBasePrice('output')}
            </div>
            <div className='text-muted-foreground/60 text-base font-medium'>
              {tokenUnitDisplay}
            </div>
          </div>
        </div>
      </div>
      {secondaryItems.length > 0 && (
        <div className='grid grid-cols-3 gap-2'>
          {secondaryItems.map((item) => (
            <div key={item.type} className='bg-muted/30 rounded-lg px-4 py-3'>
              <div className='text-muted-foreground text-[11px]'>
                {item.label}
              </div>
              <div className='mt-1 flex items-baseline justify-between'>
                <div className='text-foreground font-mono text-base font-bold tabular-nums'>
                  {renderBasePrice(item.type)}
                </div>
                <div className='text-muted-foreground/50 text-xs'>
                  {tokenUnitDisplay}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


type DynamicPriceOptions = Parameters<typeof getDynamicPriceEntries>[1]
type DynamicPricingTier = ReturnType<typeof getDynamicPricingTiers>[number]
type DynamicFormattedPricesByTier = Map<DynamicPricingTier, Map<string, string>>

function getDynamicPriceFields(
  tiers: DynamicPricingTier[],
  options: DynamicPriceOptions
) {
  return Array.from(
    new Map(
      tiers
        .flatMap((tier) => getDynamicPriceEntries(tier, options))
        .map((entry) => [entry.field, entry])
    ).values()
  )
}

function getDynamicFormattedPricesByTier(
  tiers: DynamicPricingTier[],
  options: DynamicPriceOptions
): DynamicFormattedPricesByTier {
  return new Map(
    tiers.map((tier) => [
      tier,
      new Map(
        getDynamicPriceEntries(tier, options).map((entry) => [
          entry.field,
          entry.formatted,
        ])
      ),
    ])
  )
}

// ----------------------------------------------------------------------------
// Group pricing table
// ----------------------------------------------------------------------------

const GRID_COLS_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
}

function GroupPricingSection(props: {
  model: PricingModel
  groupRatio: Record<string, number>
  usableGroup: Record<string, { desc: string; ratio: number }>
  autoGroups: string[]
  priceRate: number
  usdExchangeRate: number
  tokenUnit: TokenUnit
  showRechargePrice?: boolean
}) {
  const { t } = useTranslation()
  const showRechargePrice = props.showRechargePrice ?? false

  const availableGroups = useMemo(
    () => getAvailableGroups(props.model, props.usableGroup || {}),
    [props.model, props.usableGroup]
  )

  const isTokenBased = isTokenBasedModel(props.model)

  const priceFields = useMemo(() => {
    const fields: { label: string; type: PriceType }[] = []
    if (isTokenBased) {
      fields.push({ label: t('Input'), type: 'input' })
      fields.push({ label: t('Output'), type: 'output' })
      if (props.model.cache_ratio != null)
        fields.push({ label: t('Cache'), type: 'cache' })
      if (props.model.create_cache_ratio != null)
        fields.push({ label: t('Cache Write'), type: 'create_cache' })
      if (props.model.image_ratio != null)
        fields.push({ label: t('Image'), type: 'image' })
      if (props.model.audio_ratio != null)
        fields.push({ label: t('Audio In'), type: 'audio_input' })
      if (
        props.model.audio_ratio != null &&
        props.model.audio_completion_ratio != null
      )
        fields.push({ label: t('Audio Out'), type: 'audio_output' })
    }
    return fields
  }, [props.model, isTokenBased, t])

  if (availableGroups.length === 0) {
    return (
      <div>
        <p className='text-muted-foreground text-sm'>
          {t(
            'This model is not available in any group, or no group pricing information is configured.'
          )}
        </p>
      </div>
    )
  }

  if (isDynamicPricingModel(props.model)) {
    const dynamicTiers = getDynamicPricingTiers(props.model)

    if (dynamicTiers.length === 0) {
      return (
        <div>
          <div className='rounded-lg border border-amber-200/70 bg-amber-50/70 p-3 dark:border-amber-500/20 dark:bg-amber-500/10'>
            <div className='text-sm font-medium text-amber-800 dark:text-amber-200'>
              {t('Special billing expression')}
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              {t(
                'Group prices cannot be expanded because this expression is not a standard tiered pricing expression.'
              )}
            </p>
          </div>
        </div>
      )
    }

    const dynPriceFields = getDynamicPriceFields(dynamicTiers, {
      tokenUnit: props.tokenUnit,
      showRechargePrice,
      priceRate: props.priceRate,
      usdExchangeRate: props.usdExchangeRate,
      groupRatioMultiplier: 1,
    })
    const colCount = Math.min(dynPriceFields.length, 5)
    const gridClass = GRID_COLS_CLASS[colCount] ?? 'grid-cols-3'

    const dynUnitSuffix = props.tokenUnit === 'K' ? '/K' : '/M'

    return (
      <div className='space-y-2'>
        {availableGroups.map((group) => {
          const ratio = props.groupRatio[group] || 1
          const pricesByTier = getDynamicFormattedPricesByTier(dynamicTiers, {
            tokenUnit: props.tokenUnit,
            showRechargePrice,
            priceRate: props.priceRate,
            usdExchangeRate: props.usdExchangeRate,
            groupRatioMultiplier: ratio,
          })
          const firstTier = dynamicTiers[0]
          const firstTierPrices = firstTier
            ? pricesByTier.get(firstTier)
            : undefined

          return (
            <div
              key={group}
              className='bg-muted/30 flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center'
            >
              <div className='flex shrink-0 items-center gap-2 sm:w-1/4'>
                <GroupBadge group={group} size='sm' />
                <span className='rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-300/90'>
                  {formatRatioLabel(ratio)}
                </span>
              </div>
              <div className={cn('grid flex-1 gap-3', gridClass)}>
                {dynPriceFields.map((field) => (
                  <div key={field.field}>
                    <div className='text-muted-foreground text-[10px]'>
                      {t(field.shortLabel)}
                    </div>
                    <div className='text-foreground font-mono text-sm font-bold tabular-nums'>
                      {firstTierPrices?.get(field.field) ?? '—'}
                      <span className='text-muted-foreground/50 ml-0.5 text-[10px] font-normal'>
                        {dynUnitSuffix}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderGroupPrice = (group: string, type: PriceType) =>
    formatGroupPrice(
      props.model,
      group,
      type,
      props.tokenUnit,
      showRechargePrice,
      props.priceRate,
      props.usdExchangeRate,
      props.groupRatio
    )
  const renderFixedGroupPrice = (group: string) =>
    formatFixedPrice(
      props.model,
      group,
      showRechargePrice,
      props.priceRate,
      props.usdExchangeRate,
      props.groupRatio
    )

  const gridClass = GRID_COLS_CLASS[priceFields.length] ?? 'grid-cols-3'
  const unitSuffix = props.tokenUnit === 'K' ? '/K' : '/M'

  return (
    <div className='space-y-2'>
      {availableGroups.map((group) => {
        const ratio = props.groupRatio[group] || 1
        return (
          <div
            key={group}
            className='bg-muted/30 flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center'
          >
            <div className='flex shrink-0 items-center gap-2 sm:w-1/4'>
              <GroupBadge group={group} size='sm' />
              <span className='rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-300/90'>
                {formatRatioLabel(ratio)}
              </span>
            </div>
            {isTokenBased ? (
              <div className={cn('grid flex-1 gap-3', gridClass)}>
                {priceFields.map((field) => (
                  <div key={field.type}>
                    <div className='text-muted-foreground text-[10px]'>
                      {field.label}
                    </div>
                    <div className='text-foreground font-mono text-sm font-bold tabular-nums'>
                      {renderGroupPrice(group, field.type)}
                      <span className='text-muted-foreground/50 ml-0.5 text-[10px] font-normal'>
                        {unitSuffix}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-1 items-baseline justify-end'>
                <span className='text-foreground font-mono text-base font-bold tabular-nums'>
                  {renderFixedGroupPrice(group)}
                </span>
                <span className='text-muted-foreground/50 ml-0.5 text-xs font-normal'>
                  /{t('次')}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Endpoint list (simple list showing endpoint name + path + method)
// ----------------------------------------------------------------------------

function EndpointListSection(props: {
  endpointMap: Record<string, { path?: string; method?: string }>
  model: PricingModel
}) {
  const endpoints = props.model.supported_endpoint_types || []

  const items = endpoints
    .map((type) => {
      const info = props.endpointMap[type]
      if (!info?.path) return null
      return {
        type,
        label: ENDPOINT_DISPLAY_NAMES[type] ?? type,
        path: info.path,
        method: (info.method || 'POST').toUpperCase(),
      }
    })
    .filter(Boolean) as {
    type: string
    label: string
    path: string
    method: string
  }[]

  if (items.length === 0) return null

  return (
    <section>
      <div className='divide-border/60 divide-y rounded-lg border'>
        {items.map((item) => (
          <div
            key={item.type}
            className='flex items-center gap-3 px-3 py-2.5'
          >
            <span className='bg-success/20 size-2 shrink-0 rounded-full' />
            <span className='text-foreground min-w-0 shrink-0 text-sm font-medium'>
              {item.label}
            </span>
            <span className='text-muted-foreground min-w-0 flex-1 truncate font-mono text-xs'>
              {item.path}
            </span>
            <span className='bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold'>
              {item.method}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export interface ModelDetailsContentProps {
  model: PricingModel
  groupRatio: Record<string, number>
  usableGroup: Record<string, { desc: string; ratio: number }>
  endpointMap: Record<string, { path?: string; method?: string }>
  autoGroups: string[]
  priceRate: number
  usdExchangeRate: number
  tokenUnit: TokenUnit
  showRechargePrice?: boolean
}

export function ModelDetailsContent(props: ModelDetailsContentProps) {
  const showRechargePrice = props.showRechargePrice ?? false

  return (
    <div className='@container/details space-y-4'>
      <ModelHeader model={props.model} />

      <div className='space-y-6'>
        <EndpointListSection
          endpointMap={props.endpointMap}
          model={props.model}
        />

        <OverviewSummaryGrid model={props.model} />

        <section className='bg-card/60 space-y-5 rounded-xl border p-4 shadow-sm'>
          <PriceSection
            model={props.model}
            priceRate={props.priceRate}
            usdExchangeRate={props.usdExchangeRate}
            tokenUnit={props.tokenUnit}
            showRechargePrice={showRechargePrice}
          />
          <GroupPricingSection
            model={props.model}
            groupRatio={props.groupRatio}
            usableGroup={props.usableGroup}
            autoGroups={props.autoGroups}
            priceRate={props.priceRate}
            usdExchangeRate={props.usdExchangeRate}
            tokenUnit={props.tokenUnit}
            showRechargePrice={showRechargePrice}
          />
        </section>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Drawer & page wrappers
// ----------------------------------------------------------------------------

export interface ModelDetailsDrawerProps extends ModelDetailsContentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModelDetailsDrawer(props: ModelDetailsDrawerProps) {
  const { t } = useTranslation()
  const { open, onOpenChange, ...contentProps } = props

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className={sideDrawerContentClassName(
          'sm:max-w-xl lg:max-w-2xl xl:max-w-3xl'
        )}
      >
        <SheetHeader className='sr-only'>
          <SheetTitle>{props.model.model_name}</SheetTitle>
          <SheetDescription>{t('Model details')}</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-y-auto px-4 pt-11 pb-5 sm:px-6 sm:pt-12 sm:pb-6'>
          <ModelDetailsContent {...contentProps} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function ModelDetails() {
  const { t } = useTranslation()
  const { modelId } = useParams({ from: '/pricing/$modelId/' })
  const search = useSearch({ from: '/pricing/$modelId/' })
  const navigate = useNavigate()

  const {
    models,
    groupRatio,
    usableGroup,
    endpointMap,
    autoGroups,
    isLoading,
    priceRate,
    usdExchangeRate,
  } = usePricingData()

  const tokenUnit: TokenUnit =
    search.tokenUnit === 'K' ? 'K' : DEFAULT_TOKEN_UNIT

  const model = useMemo(() => {
    if (!models || !modelId) return null
    return models.find((m) => m.model_name === modelId) || null
  }, [models, modelId])

  const handleBack = () => {
    navigate({ to: '/pricing', search })
  }

  if (isLoading) {
    return (
      <PublicLayout>
        <div className='mx-auto max-w-5xl px-4 sm:px-6'>
          <Skeleton className='mb-4 h-5 w-16' />
          <div className='space-y-2'>
            <Skeleton className='h-7 w-64' />
            <Skeleton className='h-4 w-40' />
            <Skeleton className='h-4 w-full max-w-md' />
          </div>
          <div className='mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-16 w-full' />
            ))}
          </div>
          <div className='mt-6 space-y-3'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-24 w-full' />
            ))}
          </div>
        </div>
      </PublicLayout>
    )
  }

  if (!model) {
    return (
      <PublicLayout>
        <div className='mx-auto max-w-2xl px-4 text-center sm:px-6'>
          <h2 className='mb-1 text-base font-semibold'>
            {t('Model not found')}
          </h2>
          <p className='text-muted-foreground mb-4 text-sm'>
            {t("The model you're looking for doesn't exist.")}
          </p>
          <Button onClick={handleBack} variant='outline' size='sm'>
            {t('Back to Models')}
          </Button>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className='mx-auto max-w-5xl px-4 sm:px-6'>
        <Button
          variant='ghost'
          size='sm'
          onClick={handleBack}
          className='text-muted-foreground hover:text-foreground mb-4 h-auto gap-1 px-0 py-1 text-xs'
        >
          <ArrowLeft className='size-3.5' />
          {t('Back')}
        </Button>

        <ModelDetailsContent
          model={model}
          groupRatio={groupRatio || {}}
          usableGroup={usableGroup || {}}
          autoGroups={autoGroups || []}
          priceRate={priceRate ?? 1}
          usdExchangeRate={usdExchangeRate ?? 1}
          tokenUnit={tokenUnit}
          showRechargePrice={search.rechargePrice ?? false}
          endpointMap={
            (endpointMap as Record<
              string,
              { path?: string; method?: string }
            >) || {}
          }
        />
      </div>
    </PublicLayout>
  )
}

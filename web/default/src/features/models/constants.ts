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
import { type TFunction } from 'i18next'
import type { NameRule, ModelStatus, SyncSource } from './types'

// ============================================================================
// Pagination
// ============================================================================

export const DEFAULT_PAGE_SIZE = 20

// ============================================================================
// Name Rule Options
// ============================================================================

export function getNameRuleOptions(t: TFunction) {
  return [
    { label: t('Exact Match'), value: 0 as NameRule },
    { label: t('Prefix Match'), value: 1 as NameRule },
    { label: t('Contains Match'), value: 2 as NameRule },
    { label: t('Suffix Match'), value: 3 as NameRule },
  ] as const
}

export function getNameRuleConfig(
  t: TFunction
): Record<NameRule, { label: string; color: string; description: string }> {
  return {
    0: {
      label: t('Exact'),
      color: 'green',
      description: t('Match model name exactly'),
    },
    1: {
      label: t('Prefix'),
      color: 'blue',
      description: t('Match models starting with this name'),
    },
    2: {
      label: t('Contains'),
      color: 'orange',
      description: t('Match models containing this name'),
    },
    3: {
      label: t('Suffix'),
      color: 'purple',
      description: t('Match models ending with this name'),
    },
  }
}

// ============================================================================
// Model Status
// ============================================================================

export function getModelStatusOptions(t: TFunction) {
  return [
    { label: t('All Status'), value: 'all' },
    { label: t('Enabled'), value: 'enabled' },
    { label: t('Disabled'), value: 'disabled' },
  ] as const
}

export function getModelStatusConfig(
  t: TFunction
): Record<ModelStatus, { label: string; variant: 'success' | 'neutral' }> {
  return {
    1: { label: t('Enabled'), variant: 'success' },
    0: { label: t('Disabled'), variant: 'neutral' },
  }
}

// ============================================================================
// Sync Status Options
// ============================================================================

export function getSyncStatusOptions(t: TFunction) {
  return [
    { label: t('All Sync Status'), value: 'all' },
    { label: t('Official Sync'), value: 'yes' },
    { label: t('No Sync'), value: 'no' },
  ] as const
}

// ============================================================================
// Deployment Status
// ============================================================================

export function getDeploymentStatusOptions(t: TFunction) {
  return [
    { label: t('All Status'), value: 'all' },
    { label: t('Running'), value: 'running' },
    { label: t('Completed'), value: 'completed' },
    { label: t('Failed'), value: 'failed' },
    { label: t('Deployment requested'), value: 'deployment requested' },
    { label: t('Termination requested'), value: 'termination requested' },
    { label: t('Destroyed'), value: 'destroyed' },
  ] as const
}

export function getDeploymentStatusConfig(t: TFunction): Record<
  string,
  {
    label: string
    variant: 'success' | 'neutral' | 'warning' | 'danger'
  }
> {
  return {
    running: { label: t('Running'), variant: 'success' },
    completed: { label: t('Completed'), variant: 'success' },
    failed: { label: t('Failed'), variant: 'danger' },
    error: { label: t('Failed'), variant: 'danger' },
    destroyed: { label: t('Destroyed'), variant: 'danger' },
    'deployment requested': {
      label: t('Deployment requested'),
      variant: 'warning',
    },
    'termination requested': {
      label: t('Termination requested'),
      variant: 'warning',
    },
  }
}

// ============================================================================
// Quota Type
// ============================================================================

export function getQuotaTypeConfig(
  t: TFunction
): Record<number, { label: string; color: string }> {
  return {
    0: { label: t('Usage-based'), color: 'violet' },
    1: { label: t('Per-call'), color: 'teal' },
  }
}

// ============================================================================
// Endpoint Templates
// ============================================================================

export const ENDPOINT_TEMPLATES: Record<
  string,
  { path: string; method: string }
> = {
  openai: { path: '/v1/chat/completions', method: 'POST' },
  'openai-response': { path: '/v1/responses', method: 'POST' },
  'openai-response-compact': { path: '/v1/responses/compact', method: 'POST' },
  anthropic: { path: '/v1/messages', method: 'POST' },
  gemini: { path: '/v1beta/models/{model}:generateContent', method: 'POST' },
  'jina-rerank': { path: '/v1/rerank', method: 'POST' },
  'image-generation': { path: '/v1/images/generations', method: 'POST' },
  'image-edit': { path: '/v1/images/edits', method: 'POST' },
  embeddings: { path: '/v1/embeddings', method: 'POST' },
  'audio-speech': { path: '/v1/audio/speech', method: 'POST' },
  'audio-transcription': { path: '/v1/audio/transcriptions', method: 'POST' },
}

// ============================================================================
// Sync Locale Options
// ============================================================================

export function getSyncSourceOptions(_t: TFunction) {
  return [
    {
      label: '官方仓库',
      value: 'official' as SyncSource,
      description: '从公共上游元数据仓库同步模型信息',
      disabled: false,
    },
    {
      label: '从渠道导入',
      value: 'channels' as SyncSource,
      description: '通过已配置渠道的定价接口获取模型信息',
      disabled: false,
    },
  ] as const
}

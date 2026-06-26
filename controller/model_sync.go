package controller

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/rand"
	"net"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/ratio_setting"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// 上游地址
const (
	upstreamModelsURL  = "https://basellm.github.io/llm-metadata/api/newapi/models.json"
	upstreamVendorsURL = "https://basellm.github.io/llm-metadata/api/newapi/vendors.json"
)

func normalizeLocale(locale string) (string, bool) {
	l := strings.ToLower(strings.TrimSpace(locale))
	switch l {
	case "en", "zh-CN", "zh-TW", "ja":
		return l, true
	default:
		return "", false
	}
}

func getUpstreamBase() string {
	return common.GetEnvOrDefaultString("SYNC_UPSTREAM_BASE", "https://basellm.github.io/llm-metadata")
}

func getUpstreamURLs(locale string) (modelsURL, vendorsURL string) {
	base := strings.TrimRight(getUpstreamBase(), "/")
	if l, ok := normalizeLocale(locale); ok && l != "" {
		return fmt.Sprintf("%s/api/i18n/%s/newapi/models.json", base, l),
			fmt.Sprintf("%s/api/i18n/%s/newapi/vendors.json", base, l)
	}
	return fmt.Sprintf("%s/api/newapi/models.json", base), fmt.Sprintf("%s/api/newapi/vendors.json", base)
}

type upstreamEnvelope[T any] struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    []T    `json:"data"`
}

type upstreamModel struct {
	Description string          `json:"description"`
	Endpoints   json.RawMessage `json:"endpoints"`
	Icon        string          `json:"icon"`
	ModelName   string          `json:"model_name"`
	NameRule    int             `json:"name_rule"`
	Status      int             `json:"status"`
	Tags        string          `json:"tags"`
	VendorName  string          `json:"vendor_name"`
}

type upstreamVendor struct {
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Name        string `json:"name"`
	Status      int    `json:"status"`
}

var (
	etagCache  = make(map[string]string)
	bodyCache  = make(map[string][]byte)
	cacheMutex sync.RWMutex
)

type overwriteField struct {
	ModelName string   `json:"model_name"`
	Fields    []string `json:"fields"`
}

type syncRequest struct {
	Overwrite []overwriteField `json:"overwrite"`
	Locale    string           `json:"locale"`
}

func newHTTPClient() *http.Client {
	timeoutSec := common.GetEnvOrDefault("SYNC_HTTP_TIMEOUT_SECONDS", 10)
	dialer := &net.Dialer{Timeout: time.Duration(timeoutSec) * time.Second}
	transport := &http.Transport{
		MaxIdleConns:          100,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   time.Duration(timeoutSec) * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
		ResponseHeaderTimeout: time.Duration(timeoutSec) * time.Second,
	}
	if common.TLSInsecureSkipVerify {
		transport.TLSClientConfig = common.InsecureTLSConfig
	}
	transport.DialContext = func(ctx context.Context, network, addr string) (net.Conn, error) {
		host, _, err := net.SplitHostPort(addr)
		if err != nil {
			host = addr
		}
		if strings.HasSuffix(host, "github.io") {
			if conn, err := dialer.DialContext(ctx, "tcp4", addr); err == nil {
				return conn, nil
			}
			return dialer.DialContext(ctx, "tcp6", addr)
		}
		return dialer.DialContext(ctx, network, addr)
	}
	return &http.Client{Transport: transport}
}

var (
	httpClientOnce sync.Once
	httpClient     *http.Client
)

func getHTTPClient() *http.Client {
	httpClientOnce.Do(func() {
		httpClient = newHTTPClient()
	})
	return httpClient
}

func fetchJSON[T any](ctx context.Context, url string, out *upstreamEnvelope[T]) error {
	var lastErr error
	attempts := common.GetEnvOrDefault("SYNC_HTTP_RETRY", 3)
	if attempts < 1 {
		attempts = 1
	}
	baseDelay := 200 * time.Millisecond
	maxMB := common.GetEnvOrDefault("SYNC_HTTP_MAX_MB", 10)
	maxBytes := int64(maxMB) << 20
	for attempt := 0; attempt < attempts; attempt++ {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		if err != nil {
			return err
		}
		// ETag conditional request
		cacheMutex.RLock()
		if et := etagCache[url]; et != "" {
			req.Header.Set("If-None-Match", et)
		}
		cacheMutex.RUnlock()

		resp, err := getHTTPClient().Do(req)
		if err != nil {
			lastErr = err
			// backoff with jitter
			sleep := baseDelay * time.Duration(1<<attempt)
			jitter := time.Duration(rand.Intn(150)) * time.Millisecond
			time.Sleep(sleep + jitter)
			continue
		}
		func() {
			defer resp.Body.Close()
			switch resp.StatusCode {
			case http.StatusOK:
				// read body into buffer for caching and flexible decode
				limited := io.LimitReader(resp.Body, maxBytes)
				buf, err := io.ReadAll(limited)
				if err != nil {
					lastErr = err
					return
				}
				// cache body and ETag
				cacheMutex.Lock()
				if et := resp.Header.Get("ETag"); et != "" {
					etagCache[url] = et
				}
				bodyCache[url] = buf
				cacheMutex.Unlock()

				// Try decode as envelope first
				if err := json.Unmarshal(buf, out); err != nil {
					// Try decode as pure array
					var arr []T
					if err2 := json.Unmarshal(buf, &arr); err2 != nil {
						lastErr = err
						return
					}
					out.Success = true
					out.Data = arr
					out.Message = ""
				} else {
					if !out.Success && len(out.Data) == 0 && out.Message == "" {
						out.Success = true
					}
				}
				lastErr = nil
			case http.StatusNotModified:
				// use cache
				cacheMutex.RLock()
				buf := bodyCache[url]
				cacheMutex.RUnlock()
				if len(buf) == 0 {
					lastErr = errors.New("cache miss for 304 response")
					return
				}
				if err := json.Unmarshal(buf, out); err != nil {
					var arr []T
					if err2 := json.Unmarshal(buf, &arr); err2 != nil {
						lastErr = err
						return
					}
					out.Success = true
					out.Data = arr
					out.Message = ""
				} else {
					if !out.Success && len(out.Data) == 0 && out.Message == "" {
						out.Success = true
					}
				}
				lastErr = nil
			default:
				lastErr = errors.New(resp.Status)
			}
		}()
		if lastErr == nil {
			return nil
		}
		sleep := baseDelay * time.Duration(1<<attempt)
		jitter := time.Duration(rand.Intn(150)) * time.Millisecond
		time.Sleep(sleep + jitter)
	}
	return lastErr
}

func ensureVendorID(vendorName string, vendorByName map[string]upstreamVendor, vendorIDCache map[string]int, createdVendors *int) int {
	if vendorName == "" {
		return 0
	}
	if id, ok := vendorIDCache[vendorName]; ok {
		return id
	}
	var existing model.Vendor
	if err := model.DB.Where("name = ?", vendorName).First(&existing).Error; err == nil {
		vendorIDCache[vendorName] = existing.Id
		return existing.Id
	}
	uv := vendorByName[vendorName]
	v := &model.Vendor{
		Name:        vendorName,
		Description: uv.Description,
		Icon:        coalesce(uv.Icon, ""),
		Status:      chooseStatus(uv.Status, 1),
	}
	if err := v.Insert(); err == nil {
		*createdVendors++
		vendorIDCache[vendorName] = v.Id
		return v.Id
	}
	vendorIDCache[vendorName] = 0
	return 0
}

// SyncUpstreamModels 同步上游模型与供应商：
// - 默认仅创建「未配置模型」
// - 可通过 overwrite 选择性覆盖更新本地已有模型的字段（前提：sync_official <> 0）
func SyncUpstreamModels(c *gin.Context) {
	var req syncRequest
	// 允许空体
	_ = c.ShouldBindJSON(&req)
	// 1) 获取未配置模型列表
	missing, err := model.GetMissingModels()
	if err != nil {
		common.SysError("failed to get missing models: " + err.Error())
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "获取模型列表失败，请稍后重试"})
		return
	}

	// 若既无缺失模型需要创建，也未指定覆盖更新字段，则无需请求上游数据，直接返回
	if len(missing) == 0 && len(req.Overwrite) == 0 {
		modelsURL, vendorsURL := getUpstreamURLs(req.Locale)
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"created_models":  0,
				"created_vendors": 0,
				"updated_models":  0,
				"skipped_models":  []string{},
				"created_list":    []string{},
				"updated_list":    []string{},
				"source": gin.H{
					"locale":      req.Locale,
					"models_url":  modelsURL,
					"vendors_url": vendorsURL,
				},
			},
		})
		return
	}

	// 2) 拉取上游 vendors 与 models
	timeoutSec := common.GetEnvOrDefault("SYNC_HTTP_TIMEOUT_SECONDS", 15)
	ctx, cancel := context.WithTimeout(c.Request.Context(), time.Duration(timeoutSec)*time.Second)
	defer cancel()

	modelsURL, vendorsURL := getUpstreamURLs(req.Locale)
	var vendorsEnv upstreamEnvelope[upstreamVendor]
	var modelsEnv upstreamEnvelope[upstreamModel]
	var fetchErr error
	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		// vendor 失败不拦截
		_ = fetchJSON(ctx, vendorsURL, &vendorsEnv)
	}()
	go func() {
		defer wg.Done()
		if err := fetchJSON(ctx, modelsURL, &modelsEnv); err != nil {
			fetchErr = err
		}
	}()
	wg.Wait()
	if fetchErr != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "获取上游模型失败: " + fetchErr.Error(), "locale": req.Locale, "source_urls": gin.H{"models_url": modelsURL, "vendors_url": vendorsURL}})
		return
	}

	// 建立映射
	vendorByName := make(map[string]upstreamVendor)
	for _, v := range vendorsEnv.Data {
		if v.Name != "" {
			vendorByName[v.Name] = v
		}
	}
	modelByName := make(map[string]upstreamModel)
	for _, m := range modelsEnv.Data {
		if m.ModelName != "" {
			modelByName[m.ModelName] = m
		}
	}

	// 3) 执行同步：仅创建缺失模型；若上游缺失该模型则跳过
	createdModels := 0
	createdVendors := 0
	updatedModels := 0
	skipped := make([]string, 0)
	createdList := make([]string, 0)
	updatedList := make([]string, 0)

	// 本地缓存：vendorName -> id
	vendorIDCache := make(map[string]int)

	for _, name := range missing {
		up, ok := modelByName[name]
		if !ok {
			skipped = append(skipped, name)
			continue
		}

		// 若本地已存在且设置为不同步，则跳过（极端情况：缺失列表与本地状态不同步时）
		var existing model.Model
		if err := model.DB.Where("model_name = ?", name).First(&existing).Error; err == nil {
			if existing.SyncOfficial == 0 {
				skipped = append(skipped, name)
				continue
			}
		}

		// 确保 vendor 存在
		vendorID := ensureVendorID(up.VendorName, vendorByName, vendorIDCache, &createdVendors)

		// 创建模型
		mi := &model.Model{
			ModelName:   name,
			Description: up.Description,
			Icon:        up.Icon,
			Tags:        up.Tags,
			VendorID:    vendorID,
			Status:      chooseStatus(up.Status, 1),
			NameRule:    up.NameRule,
		}
		if err := mi.Insert(); err == nil {
			createdModels++
			createdList = append(createdList, name)
		} else {
			skipped = append(skipped, name)
		}
	}

	// 4) 补全已存在模型的空字段（用上游数据补全 description/tags/vendor/icon，不覆盖已有值）
	var existingModels []model.Model
	_ = model.DB.Where("model_name IN ?", func() []string {
		names := make([]string, 0, len(modelByName))
		for n := range modelByName {
			names = append(names, n)
		}
		return names
	}()).Find(&existingModels).Error

	filledModels := 0
	for _, local := range existingModels {
		up, ok := modelByName[local.ModelName]
		if !ok {
			continue
		}
		needUpdate := false
		if strings.TrimSpace(local.Description) == "" && strings.TrimSpace(up.Description) != "" {
			local.Description = up.Description
			needUpdate = true
		}
		if strings.TrimSpace(local.Tags) == "" && strings.TrimSpace(up.Tags) != "" {
			local.Tags = up.Tags
			needUpdate = true
		}
		if strings.TrimSpace(local.Icon) == "" && strings.TrimSpace(up.Icon) != "" {
			local.Icon = up.Icon
			needUpdate = true
		}
		if local.VendorID == 0 && up.VendorName != "" {
			vendorID := ensureVendorID(up.VendorName, vendorByName, vendorIDCache, &createdVendors)
			if vendorID > 0 {
				local.VendorID = vendorID
				needUpdate = true
			}
		}
		if needUpdate {
			if err := model.DB.Save(&local).Error; err == nil {
				filledModels++
			}
		}
	}

	// 5) 处理可选覆盖（更新本地已有模型的差异字段）
	if len(req.Overwrite) > 0 {
		// vendorIDCache 已用于创建阶段，可复用
		for _, ow := range req.Overwrite {
			up, ok := modelByName[ow.ModelName]
			if !ok {
				continue
			}
			var local model.Model
			if err := model.DB.Where("model_name = ?", ow.ModelName).First(&local).Error; err != nil {
				continue
			}

			// 跳过被禁用官方同步的模型
			if local.SyncOfficial == 0 {
				continue
			}

			// 映射 vendor
			newVendorID := ensureVendorID(up.VendorName, vendorByName, vendorIDCache, &createdVendors)

			// 应用字段覆盖（事务）
			_ = model.DB.Transaction(func(tx *gorm.DB) error {
				needUpdate := false
				if containsField(ow.Fields, "description") {
					local.Description = up.Description
					needUpdate = true
				}
				if containsField(ow.Fields, "icon") {
					local.Icon = up.Icon
					needUpdate = true
				}
				if containsField(ow.Fields, "tags") {
					local.Tags = up.Tags
					needUpdate = true
				}
				if containsField(ow.Fields, "vendor") {
					local.VendorID = newVendorID
					needUpdate = true
				}
				if containsField(ow.Fields, "name_rule") {
					local.NameRule = up.NameRule
					needUpdate = true
				}
				if containsField(ow.Fields, "status") {
					local.Status = chooseStatus(up.Status, local.Status)
					needUpdate = true
				}
				if !needUpdate {
					return nil
				}
				if err := tx.Save(&local).Error; err != nil {
					return err
				}
				updatedModels++
				updatedList = append(updatedList, ow.ModelName)
				return nil
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"created_models":  createdModels,
			"created_vendors": createdVendors,
			"updated_models":  updatedModels,
			"filled_models":   filledModels,
			"skipped_models":  skipped,
			"created_list":    createdList,
			"updated_list":    updatedList,
			"source": gin.H{
				"locale":      req.Locale,
				"models_url":  modelsURL,
				"vendors_url": vendorsURL,
			},
		},
	})
}

func containsField(fields []string, key string) bool {
	key = strings.ToLower(strings.TrimSpace(key))
	for _, f := range fields {
		if strings.ToLower(strings.TrimSpace(f)) == key {
			return true
		}
	}
	return false
}

func coalesce(a, b string) string {
	if strings.TrimSpace(a) != "" {
		return a
	}
	return b
}

func chooseStatus(primary, fallback int) int {
	if primary == 0 && fallback != 0 {
		return fallback
	}
	if primary != 0 {
		return primary
	}
	return 1
}

// SyncUpstreamPreview 预览上游与本地的差异（仅用于弹窗选择）
// channelPricingModel represents a single model entry from /api/pricing response.
// Supports both: direct "supplier" string OR "vendor_id" with separate vendors array.
type channelPricingModel struct {
	ModelName   string          `json:"model_name"`
	Description string          `json:"description"`
	Supplier    string          `json:"supplier"`
	VendorID    int             `json:"vendor_id"`
	Tags        json.RawMessage `json:"tags"`
	Endpoints   json.RawMessage `json:"endpoints"`
}

type channelPricingVendor struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type channelPricingResponse struct {
	Success bool                   `json:"success"`
	Data    []channelPricingModel  `json:"data"`
	Vendors []channelPricingVendor `json:"vendors"`
}

type channelPricingResult struct {
	Models    []channelPricingModel
	VendorMap map[int]string
}

type syncFromChannelsRequest struct {
	ChannelIDs []int `json:"channel_ids"`
}

// parseChannelEndpoints converts upstream endpoints field to local JSON format.
// Upstream formats: ["chat","responses"] or {"openai":{"path":"/v1/...", "method":"POST"}}
func parseChannelEndpoints(raw json.RawMessage) string {
	if len(raw) == 0 || string(raw) == "null" {
		return ""
	}
	// Try as array of strings like ["chat", "responses"]
	var arr []string
	if err := json.Unmarshal(raw, &arr); err == nil && len(arr) > 0 {
		endpointMap := make(map[string]string, len(arr))
		for _, ep := range arr {
			switch ep {
			case "chat":
				endpointMap["openai"] = "/v1/chat/completions"
			case "responses":
				endpointMap["openai-response"] = "/v1/responses"
			case "embeddings":
				endpointMap["embeddings"] = "/v1/embeddings"
			case "image-generation", "images":
				endpointMap["image-generation"] = "/v1/images/generations"
			case "image-edit":
				endpointMap["image-edit"] = "/v1/images/edits"
			case "audio-speech", "tts":
				endpointMap["audio-speech"] = "/v1/audio/speech"
			case "audio-transcription", "stt":
				endpointMap["audio-transcription"] = "/v1/audio/transcriptions"
			default:
				endpointMap[ep] = ""
			}
		}
		// Build JSON: {"openai": "/v1/chat/completions", ...}
		result := make(map[string]interface{})
		for k, v := range endpointMap {
			if v != "" {
				result[k] = v
			}
		}
		if len(result) > 0 {
			buf, _ := json.Marshal(result)
			return string(buf)
		}
		return ""
	}
	// Try as object (already in local format)
	var obj map[string]interface{}
	if err := json.Unmarshal(raw, &obj); err == nil && len(obj) > 0 {
		return string(raw)
	}
	return ""
}

func parseChannelTags(raw json.RawMessage) string {
	if len(raw) == 0 || string(raw) == "null" {
		return ""
	}
	var str string
	if err := json.Unmarshal(raw, &str); err == nil {
		return str
	}
	var arr []struct {
		Name string `json:"name"`
	}
	if err := json.Unmarshal(raw, &arr); err == nil {
		names := make([]string, 0, len(arr))
		for _, t := range arr {
			if t.Name != "" {
				names = append(names, t.Name)
			}
		}
		return strings.Join(names, ",")
	}
	return ""
}

func fetchChannelPricing(ctx context.Context, baseURL, key string) (*channelPricingResult, error) {
	url := strings.TrimRight(baseURL, "/") + "/api/pricing"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	if key != "" {
		req.Header.Set("Authorization", "Bearer "+key)
	}
	resp, err := getHTTPClient().Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("upstream returned %d", resp.StatusCode)
	}
	maxBytes := int64(10) << 20
	body, err := io.ReadAll(io.LimitReader(resp.Body, maxBytes))
	if err != nil {
		return nil, err
	}
	var result channelPricingResponse
	if err := common.Unmarshal(body, &result); err != nil {
		return nil, err
	}
	vendorMap := make(map[int]string, len(result.Vendors))
	for _, v := range result.Vendors {
		if v.ID > 0 && v.Name != "" {
			vendorMap[v.ID] = v.Name
		}
	}
	return &channelPricingResult{
		Models:    result.Data,
		VendorMap: vendorMap,
	}, nil
}

// PreviewSyncFromChannels previews models that would be imported from channel /api/pricing endpoints.
// Logic: local channel configured models → filter against model_meta → fetch metadata only for missing ones.
func PreviewSyncFromChannels(c *gin.Context) {
	var req syncFromChannelsRequest
	if err := c.ShouldBindJSON(&req); err != nil || len(req.ChannelIDs) == 0 {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "请提供 channel_ids"})
		return
	}

	channels, err := model.GetChannelsByIds(req.ChannelIDs)
	if err != nil || len(channels) == 0 {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "未找到有效渠道"})
		return
	}

	// Step 1: Collect models configured in local channels
	localModelSet := make(map[string]struct{})
	for _, ch := range channels {
		for _, m := range ch.GetModels() {
			m = strings.TrimSpace(m)
			if m != "" {
				localModelSet[m] = struct{}{}
			}
		}
	}
	if len(localModelSet) == 0 {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "所选渠道未配置任何模型"})
		return
	}

	// Step 2: Find which are missing from model_meta
	localModels := make([]string, 0, len(localModelSet))
	for name := range localModelSet {
		localModels = append(localModels, name)
	}
	var existingNames []string
	_ = model.DB.Model(&model.Model{}).Where("model_name IN ?", localModels).Pluck("model_name", &existingNames).Error
	existingSet := make(map[string]struct{}, len(existingNames))
	for _, name := range existingNames {
		existingSet[name] = struct{}{}
	}

	missingModels := make([]string, 0)
	for name := range localModelSet {
		if _, exists := existingSet[name]; !exists {
			missingModels = append(missingModels, name)
		}
	}

	if len(missingModels) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"missing":       []interface{}{},
				"missing_count": 0,
				"total_local":   len(localModelSet),
			},
		})
		return
	}

	// Step 3: Fetch pricing from channels to get metadata for missing models
	timeoutSec := common.GetEnvOrDefault("SYNC_HTTP_TIMEOUT_SECONDS", 15)
	ctx, cancel := context.WithTimeout(c.Request.Context(), time.Duration(timeoutSec)*time.Second)
	defer cancel()

	missingSet := make(map[string]struct{}, len(missingModels))
	for _, name := range missingModels {
		missingSet[name] = struct{}{}
	}

	pricingMeta := make(map[string]channelPricingModel)
	upstreamVendorMap := make(map[int]string)
	for _, ch := range channels {
		baseURL := ch.GetBaseURL()
		if baseURL == "" {
			continue
		}
		result, fetchErr := fetchChannelPricing(ctx, baseURL, ch.Key)
		if fetchErr != nil {
			continue
		}
		for id, name := range result.VendorMap {
			if _, exists := upstreamVendorMap[id]; !exists {
				upstreamVendorMap[id] = name
			}
		}
		for _, m := range result.Models {
			if m.ModelName == "" {
				continue
			}
			if _, needed := missingSet[m.ModelName]; needed {
				if _, exists := pricingMeta[m.ModelName]; !exists {
					pricingMeta[m.ModelName] = m
				}
			}
		}
	}

	// Step 4: Build preview list
	type previewItem struct {
		ModelName   string `json:"model_name"`
		Description string `json:"description,omitempty"`
		Supplier    string `json:"supplier,omitempty"`
		Tags        string `json:"tags,omitempty"`
	}
	var missing []previewItem
	for _, name := range missingModels {
		item := previewItem{ModelName: name}
		if m, ok := pricingMeta[name]; ok {
			item.Description = m.Description
			item.Tags = parseChannelTags(m.Tags)
			// Supplier: prefer direct string field, fallback to vendor_id mapping
			if m.Supplier != "" {
				item.Supplier = m.Supplier
			} else if m.VendorID > 0 {
				item.Supplier = upstreamVendorMap[m.VendorID]
			}
		}
		missing = append(missing, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"missing":       missing,
			"missing_count": len(missing),
			"total_local":   len(localModelSet),
		},
	})
}

// SyncFromChannels imports models from channel /api/pricing endpoints into model_meta.
// Only imports models that are configured in local channels but missing from model_meta.
func SyncFromChannels(c *gin.Context) {
	var req syncFromChannelsRequest
	if err := c.ShouldBindJSON(&req); err != nil || len(req.ChannelIDs) == 0 {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "请提供 channel_ids"})
		return
	}

	channels, err := model.GetChannelsByIds(req.ChannelIDs)
	if err != nil || len(channels) == 0 {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "未找到有效渠道"})
		return
	}

	// Step 1: Collect models configured in local channels
	localModelSet := make(map[string]struct{})
	for _, ch := range channels {
		for _, m := range ch.GetModels() {
			m = strings.TrimSpace(m)
			if m != "" {
				localModelSet[m] = struct{}{}
			}
		}
	}
	if len(localModelSet) == 0 {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "所选渠道未配置任何模型"})
		return
	}

	// Step 2: Find which are missing from model_meta
	localModels := make([]string, 0, len(localModelSet))
	for name := range localModelSet {
		localModels = append(localModels, name)
	}
	var existingNames []string
	_ = model.DB.Model(&model.Model{}).Where("model_name IN ?", localModels).Pluck("model_name", &existingNames).Error
	existingSet := make(map[string]struct{}, len(existingNames))
	for _, name := range existingNames {
		existingSet[name] = struct{}{}
	}

	missingModels := make([]string, 0)
	for name := range localModelSet {
		if _, exists := existingSet[name]; !exists {
			missingModels = append(missingModels, name)
		}
	}

	// Step 3: Fetch pricing from channels to get metadata for missing models
	timeoutSec := common.GetEnvOrDefault("SYNC_HTTP_TIMEOUT_SECONDS", 15)
	ctx, cancel := context.WithTimeout(c.Request.Context(), time.Duration(timeoutSec)*time.Second)
	defer cancel()

	missingSet := make(map[string]struct{}, len(missingModels))
	for _, name := range missingModels {
		missingSet[name] = struct{}{}
	}

	pricingMeta := make(map[string]channelPricingModel)
	upstreamVendorMap := make(map[int]string)
	for _, ch := range channels {
		baseURL := ch.GetBaseURL()
		if baseURL == "" {
			continue
		}
		result, fetchErr := fetchChannelPricing(ctx, baseURL, ch.Key)
		if fetchErr != nil {
			continue
		}
		for id, name := range result.VendorMap {
			if _, exists := upstreamVendorMap[id]; !exists {
				upstreamVendorMap[id] = name
			}
		}
		for _, m := range result.Models {
			if m.ModelName == "" {
				continue
			}
			if _, needed := missingSet[m.ModelName]; needed {
				if _, exists := pricingMeta[m.ModelName]; !exists {
					pricingMeta[m.ModelName] = m
				}
			}
		}
	}

	// Step 3.5: Scrape model info from gpt.ge for ALL local models (not just missing)
	scrapeTimeout := time.Duration(len(localModels)*2+30) * time.Second
	if scrapeTimeout > 10*time.Minute {
		scrapeTimeout = 10 * time.Minute
	}
	scrapeCtx, scrapeCancel := context.WithTimeout(c.Request.Context(), scrapeTimeout)
	defer scrapeCancel()
	scrapedData := scrapeModelsFromWeb(scrapeCtx, localModels)
	for name, scraped := range scrapedData {
		existing := pricingMeta[name]
		if scraped.Tags != "" {
			existing.Tags = json.RawMessage(`"` + scraped.Tags + `"`)
		}
		if scraped.Description != "" {
			existing.Description = scraped.Description
		}
		if scraped.Endpoints != "" {
			existing.Endpoints = json.RawMessage(scraped.Endpoints)
		}
		pricingMeta[name] = existing
	}

	// Step 4: Create missing models, using pricing metadata when available
	createdCount := 0
	skippedCount := 0
	createdList := make([]string, 0)
	vendorIDCache := make(map[string]int)

	for _, name := range missingModels {
		mi := &model.Model{
			ModelName: name,
			Status:    1,
		}

		if m, hasMeta := pricingMeta[name]; hasMeta {
			mi.Description = m.Description
			mi.Tags = parseChannelTags(m.Tags)
			mi.Endpoints = parseChannelEndpoints(m.Endpoints)

			// Resolve vendor: prefer direct Supplier string, fallback to VendorID mapping
			supplierName := m.Supplier
			if supplierName == "" && m.VendorID > 0 {
				supplierName = upstreamVendorMap[m.VendorID]
			}
			if supplierName != "" {
				mi.VendorID = getOrCreateVendorID(supplierName, vendorIDCache)
			}
		}
		// Fallback vendor from scraped data
		if mi.VendorID == 0 {
			if scraped, ok := scrapedData[name]; ok && scraped.Vendor != "" {
				mi.VendorID = getOrCreateVendorID(scraped.Vendor, vendorIDCache)
			}
		}

		if err := mi.Insert(); err == nil {
			createdCount++
			createdList = append(createdList, name)
		} else {
			skippedCount++
		}
	}

	// Step 5: Fill missing fields from official upstream repository
	filledCount := 0
	if createdCount > 0 {
		var needFill []model.Model
		_ = model.DB.Where("model_name IN ? AND (description = '' OR tags = '' OR vendor_id = 0)",
			createdList).Find(&needFill).Error

		if len(needFill) > 0 {
			modelsURL, vendorsURL := getUpstreamURLs("")
			var modelsEnv upstreamEnvelope[upstreamModel]
			var vendorsEnv upstreamEnvelope[upstreamVendor]
			_ = fetchJSON(ctx, modelsURL, &modelsEnv)
			_ = fetchJSON(ctx, vendorsURL, &vendorsEnv)

			officialByName := make(map[string]upstreamModel, len(modelsEnv.Data))
			for _, m := range modelsEnv.Data {
				if m.ModelName != "" {
					officialByName[m.ModelName] = m
				}
			}
			vendorByName := make(map[string]upstreamVendor, len(vendorsEnv.Data))
			for _, v := range vendorsEnv.Data {
				if v.Name != "" {
					vendorByName[v.Name] = v
				}
			}

			for _, local := range needFill {
				up, ok := officialByName[local.ModelName]
				if !ok {
					continue
				}
				needUpdate := false
				if strings.TrimSpace(local.Description) == "" && strings.TrimSpace(up.Description) != "" {
					local.Description = up.Description
					needUpdate = true
				}
				if strings.TrimSpace(local.Tags) == "" && strings.TrimSpace(up.Tags) != "" {
					local.Tags = up.Tags
					needUpdate = true
				}
				if strings.TrimSpace(local.Icon) == "" && strings.TrimSpace(up.Icon) != "" {
					local.Icon = up.Icon
					needUpdate = true
				}
				if local.VendorID == 0 && up.VendorName != "" {
					vid := ensureVendorID(up.VendorName, vendorByName, vendorIDCache, &skippedCount)
					if vid > 0 {
						local.VendorID = vid
						needUpdate = true
					}
				}
				if needUpdate {
					if err := model.DB.Save(&local).Error; err == nil {
						filledCount++
					}
				}
			}
		}
	}

	// Step 5.5: Update existing models' metadata from scraped data (always overwrite)
	updatedMetaCount := 0
	scrapeVendorCache := make(map[string]int)
	for _, name := range existingNames {
		scraped, ok := scrapedData[name]
		if !ok {
			continue
		}
		var local model.Model
		if err := model.DB.Where("model_name = ?", name).First(&local).Error; err != nil {
			continue
		}
		needUpdate := false
		if scraped.Tags != "" {
			local.Tags = scraped.Tags
			needUpdate = true
		}
		if scraped.Description != "" {
			local.Description = scraped.Description
			needUpdate = true
		}
		if scraped.Endpoints != "" {
			local.Endpoints = scraped.Endpoints
			needUpdate = true
		}
		if scraped.Vendor != "" {
			vid := getOrCreateVendorID(scraped.Vendor, scrapeVendorCache)
			if vid > 0 && local.VendorID != vid {
				local.VendorID = vid
				needUpdate = true
			}
		}
		if needUpdate {
			if err := model.DB.Save(&local).Error; err == nil {
				updatedMetaCount++
			}
		}
	}

	// Step 6: Persist scraped prices to ratio settings (for ALL scraped models)
	scrapedPricesForPersist := make(map[string]*scrapedModelInfo)
	for name, sp := range scrapedData {
		if sp.InputPrice > 0 {
			scrapedPricesForPersist[name] = sp
		}
	}
	persistScrapedPrices(scrapedPricesForPersist)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"created_models":  createdCount,
			"filled_models":   filledCount,
			"updated_meta":    updatedMetaCount,
			"skipped_models":  skippedCount,
			"scraped_models":  len(scrapedData),
			"scraped_prices":  len(scrapedPricesForPersist),
			"created_list":    createdList,
			"total_fetched":   len(pricingMeta),
			"total_local":     len(localModelSet),
		},
	})
}

func SyncUpstreamPreview(c *gin.Context) {
	// 1) 拉取上游数据
	timeoutSec := common.GetEnvOrDefault("SYNC_HTTP_TIMEOUT_SECONDS", 15)
	ctx, cancel := context.WithTimeout(c.Request.Context(), time.Duration(timeoutSec)*time.Second)
	defer cancel()

	locale := c.Query("locale")
	modelsURL, vendorsURL := getUpstreamURLs(locale)

	var vendorsEnv upstreamEnvelope[upstreamVendor]
	var modelsEnv upstreamEnvelope[upstreamModel]
	var fetchErr error
	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		_ = fetchJSON(ctx, vendorsURL, &vendorsEnv)
	}()
	go func() {
		defer wg.Done()
		if err := fetchJSON(ctx, modelsURL, &modelsEnv); err != nil {
			fetchErr = err
		}
	}()
	wg.Wait()
	if fetchErr != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "获取上游模型失败: " + fetchErr.Error(), "locale": locale, "source_urls": gin.H{"models_url": modelsURL, "vendors_url": vendorsURL}})
		return
	}

	vendorByName := make(map[string]upstreamVendor)
	for _, v := range vendorsEnv.Data {
		if v.Name != "" {
			vendorByName[v.Name] = v
		}
	}
	modelByName := make(map[string]upstreamModel)
	upstreamNames := make([]string, 0, len(modelsEnv.Data))
	for _, m := range modelsEnv.Data {
		if m.ModelName != "" {
			modelByName[m.ModelName] = m
			upstreamNames = append(upstreamNames, m.ModelName)
		}
	}

	// 2) 本地已有模型
	var locals []model.Model
	if len(upstreamNames) > 0 {
		_ = model.DB.Where("model_name IN ? AND sync_official <> 0", upstreamNames).Find(&locals).Error
	}

	// 本地 vendor 名称映射
	vendorIdSet := make(map[int]struct{})
	for _, m := range locals {
		if m.VendorID != 0 {
			vendorIdSet[m.VendorID] = struct{}{}
		}
	}
	vendorIDs := make([]int, 0, len(vendorIdSet))
	for id := range vendorIdSet {
		vendorIDs = append(vendorIDs, id)
	}
	idToVendorName := make(map[int]string)
	if len(vendorIDs) > 0 {
		var dbVendors []model.Vendor
		_ = model.DB.Where("id IN ?", vendorIDs).Find(&dbVendors).Error
		for _, v := range dbVendors {
			idToVendorName[v.Id] = v.Name
		}
	}

	// 3) 缺失且上游存在的模型
	missingList, _ := model.GetMissingModels()
	var missing []string
	for _, name := range missingList {
		if _, ok := modelByName[name]; ok {
			missing = append(missing, name)
		}
	}

	// 4) 计算冲突字段
	type conflictField struct {
		Field    string      `json:"field"`
		Local    interface{} `json:"local"`
		Upstream interface{} `json:"upstream"`
	}
	type conflictItem struct {
		ModelName string          `json:"model_name"`
		Fields    []conflictField `json:"fields"`
	}

	var conflicts []conflictItem
	for _, local := range locals {
		up, ok := modelByName[local.ModelName]
		if !ok {
			continue
		}
		fields := make([]conflictField, 0, 6)
		if strings.TrimSpace(local.Description) != strings.TrimSpace(up.Description) {
			fields = append(fields, conflictField{Field: "description", Local: local.Description, Upstream: up.Description})
		}
		if strings.TrimSpace(local.Icon) != strings.TrimSpace(up.Icon) {
			fields = append(fields, conflictField{Field: "icon", Local: local.Icon, Upstream: up.Icon})
		}
		if strings.TrimSpace(local.Tags) != strings.TrimSpace(up.Tags) {
			fields = append(fields, conflictField{Field: "tags", Local: local.Tags, Upstream: up.Tags})
		}
		// vendor 对比使用名称
		localVendor := idToVendorName[local.VendorID]
		if strings.TrimSpace(localVendor) != strings.TrimSpace(up.VendorName) {
			fields = append(fields, conflictField{Field: "vendor", Local: localVendor, Upstream: up.VendorName})
		}
		if local.NameRule != up.NameRule {
			fields = append(fields, conflictField{Field: "name_rule", Local: local.NameRule, Upstream: up.NameRule})
		}
		if local.Status != chooseStatus(up.Status, local.Status) {
			fields = append(fields, conflictField{Field: "status", Local: local.Status, Upstream: up.Status})
		}
		if len(fields) > 0 {
			conflicts = append(conflicts, conflictItem{ModelName: local.ModelName, Fields: fields})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"missing":   missing,
			"conflicts": conflicts,
			"source": gin.H{
				"locale":      locale,
				"models_url":  modelsURL,
				"vendors_url": vendorsURL,
			},
		},
	})
}

// --- Web scraping from gpt.ge ---

const scrapeBaseURL = "https://gpt.ge/models/"

type scrapedModelInfo struct {
	Tags        string
	Description string
	Endpoints   string
	InputPrice  float64
	OutputPrice float64
	Vendor      string
}

var htmlCommentRe = regexp.MustCompile(`<!--.*?-->`)

func scrapeModelsFromWeb(ctx context.Context, modelNames []string) map[string]*scrapedModelInfo {
	results := make(map[string]*scrapedModelInfo)
	var mu sync.Mutex
	var wg sync.WaitGroup

	sem := make(chan struct{}, 10)
	rateLimiter := time.NewTicker(600 * time.Millisecond) // 100 requests per minute
	defer rateLimiter.Stop()
	client := &http.Client{Timeout: 10 * time.Second}

	for _, name := range modelNames {
		select {
		case <-ctx.Done():
			break
		case <-rateLimiter.C:
		}
		if ctx.Err() != nil {
			break
		}

		wg.Add(1)
		go func(modelName string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			info := scrapeModelFromWeb(ctx, client, modelName)
			if info != nil {
				mu.Lock()
				results[modelName] = info
				mu.Unlock()
			}
		}(name)
	}
	wg.Wait()
	return results
}

func scrapeModelFromWeb(ctx context.Context, client *http.Client, modelName string) *scrapedModelInfo {
	url := scrapeBaseURL + modelName
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; NewAPI/1.0)")

	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != 200 {
		if resp != nil {
			resp.Body.Close()
		}
		return nil
	}
	defer resp.Body.Close()

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil
	}

	info := &scrapedModelInfo{}
	info.Tags = scrapeTags(doc)
	info.Description = scrapeDescription(doc)
	info.Endpoints = scrapeEndpoints(doc)
	info.InputPrice, info.OutputPrice = scrapePricing(doc)
	info.Vendor = scrapeVendor(doc)

	if info.Tags == "" && info.Description == "" && info.Endpoints == "" && info.InputPrice == 0 && info.Vendor == "" {
		return nil
	}
	return info
}

func scrapeTags(doc *goquery.Document) string {
	var tags []string
	doc.Find(`span[data-slot="badge"][data-variant="outline"]`).Each(func(_ int, s *goquery.Selection) {
		text := strings.TrimSpace(s.Text())
		if text != "" && text != "POST" && text != "GET" {
			tags = append(tags, text)
		}
	})
	return strings.Join(tags, ",")
}

func scrapeDescription(doc *goquery.Document) string {
	var desc string
	doc.Find(`div[id^="S:"]`).Each(func(_ int, s *goquery.Selection) {
		prose := s.Find(`div.prose`)
		if prose.Length() > 0 && desc == "" {
			desc = strings.TrimSpace(prose.Text())
		}
	})
	if desc != "" {
		return desc
	}
	doc.Find("h2").Each(func(_ int, s *goquery.Selection) {
		if strings.Contains(s.Text(), "模型描述") && desc == "" {
			parent := s.Parent()
			desc = strings.TrimSpace(parent.Find("p").First().Text())
		}
	})
	return desc
}

func scrapeEndpoints(doc *goquery.Document) string {
	endpointMap := make(map[string]interface{})
	doc.Find("code").Each(func(_ int, s *goquery.Selection) {
		path := strings.TrimSpace(s.Text())
		if !strings.HasPrefix(path, "/v1/") {
			return
		}
		switch {
		case strings.Contains(path, "/chat/completions"):
			endpointMap["openai"] = path
		case strings.Contains(path, "/responses"):
			endpointMap["openai-response"] = path
		case path == "/v1/messages":
			endpointMap["anthropic"] = path
		case strings.Contains(path, "/embeddings"):
			endpointMap["embeddings"] = path
		case strings.Contains(path, "/images/generations"):
			endpointMap["image-generation"] = path
		case strings.Contains(path, "/images/edits"):
			endpointMap["image-edit"] = path
		case strings.Contains(path, "/audio/speech"):
			endpointMap["audio-speech"] = path
		case strings.Contains(path, "/audio/transcriptions"):
			endpointMap["audio-transcription"] = path
		default:
			key := strings.TrimPrefix(path, "/v1/")
			key = strings.ReplaceAll(key, "/", "-")
			endpointMap[key] = path
		}
	})
	if len(endpointMap) == 0 {
		return ""
	}
	buf, _ := common.Marshal(endpointMap)
	return string(buf)
}

func scrapePricing(doc *goquery.Document) (inputPrice, outputPrice float64) {
	doc.Find("table").Each(func(_ int, table *goquery.Selection) {
		headerRow := table.Find("thead tr").First()
		if !strings.Contains(headerRow.Text(), "令牌分组") {
			return
		}
		if inputPrice > 0 {
			return
		}

		type groupRow struct {
			name   string
			input  float64
			output float64
		}
		var rows []groupRow

		table.Find("tbody tr").Each(func(_ int, tr *goquery.Selection) {
			cells := tr.Find("td")
			if cells.Length() < 5 {
				return
			}
			name := strings.TrimSpace(cells.Eq(0).Text())
			inputText := cleanPriceText(cells.Eq(3).Text())
			outputText := cleanPriceText(cells.Eq(4).Text())

			inPrice := parsePrice(inputText)
			outPrice := parsePrice(outputText)
			if inPrice > 0 {
				rows = append(rows, groupRow{name: name, input: inPrice, output: outPrice})
			}
		})

		groupPriority := []string{"default", "gf", "claude_max", "claude", "gemini", "deepseek", "qwen", "sale"}
		for _, target := range groupPriority {
			for _, r := range rows {
				if r.name == target {
					inputPrice = r.input
					outputPrice = r.output
					return
				}
			}
		}
		if len(rows) > 0 {
			inputPrice = rows[0].input
			outputPrice = rows[0].output
		}
	})
	return
}

func getOrCreateVendorID(name string, cache map[string]int) int {
	if name == "" {
		return 0
	}
	if id, ok := cache[name]; ok {
		return id
	}
	var existing model.Vendor
	if err := model.DB.Where("name = ?", name).First(&existing).Error; err == nil {
		cache[name] = existing.Id
		return existing.Id
	}
	v := &model.Vendor{Name: name, Status: 1}
	if err := v.Insert(); err == nil {
		cache[name] = v.Id
		return v.Id
	}
	cache[name] = 0
	return 0
}

func scrapeVendor(doc *goquery.Document) string {
	var vendor string
	doc.Find(`nav[aria-label="breadcrumb"] a[data-slot="breadcrumb-link"]`).First().Each(func(_ int, s *goquery.Selection) {
		vendor = strings.TrimSpace(s.Text())
	})
	return vendor
}

func cleanPriceText(text string) string {
	text = htmlCommentRe.ReplaceAllString(text, "")
	text = strings.ReplaceAll(text, " ", "")
	text = strings.TrimSpace(text)
	return text
}

func parsePrice(text string) float64 {
	text = strings.TrimPrefix(text, "$")
	text = strings.TrimSuffix(text, "/M")
	text = strings.TrimSpace(text)
	val, err := strconv.ParseFloat(text, 64)
	if err != nil {
		return 0
	}
	return val
}

func persistScrapedPrices(scrapedPrices map[string]*scrapedModelInfo) {
	if len(scrapedPrices) == 0 {
		return
	}
	for name, sp := range scrapedPrices {
		if sp.InputPrice <= 0 {
			continue
		}
		modelRatio := sp.InputPrice / 2.0
		ratio_setting.SetModelRatio(name, modelRatio)
		if sp.OutputPrice > 0 && sp.InputPrice > 0 {
			completionRatio := sp.OutputPrice / sp.InputPrice
			ratio_setting.SetCompletionRatio(name, completionRatio)
		}
	}
	_ = model.UpdateOption("ModelRatio", ratio_setting.ModelRatio2JSONString())
	_ = model.UpdateOption("CompletionRatio", ratio_setting.CompletionRatio2JSONString())
}

package controller

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	_ "image/png"
	"net/http"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"golang.org/x/image/draw"
)

const (
	maxAvatarSize   = 2 << 20 // 2MB
	avatarMaxDim    = 256
	avatarJPEGQual  = 80
)

func UploadAvatar(c *gin.Context) {
	if !common.OSSEnabled() {
		common.ApiErrorMsg(c, "头像上传未配置")
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		common.ApiErrorMsg(c, "请选择文件")
		return
	}
	defer file.Close()

	if header.Size > maxAvatarSize {
		common.ApiErrorMsg(c, "文件大小不能超过2MB")
		return
	}

	contentType := header.Header.Get("Content-Type")
	switch contentType {
	case "image/jpeg", "image/png", "image/webp":
	default:
		common.ApiErrorMsg(c, "仅支持 JPG/PNG/WebP 格式")
		return
	}

	src, _, err := image.Decode(file)
	if err != nil {
		common.ApiErrorMsg(c, "无法解析图片")
		return
	}

	resized := resizeImage(src, avatarMaxDim)

	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, resized, &jpeg.Options{Quality: avatarJPEGQual}); err != nil {
		common.ApiErrorMsg(c, "图片压缩失败")
		return
	}

	userId := c.GetInt("id")
	objectKey := fmt.Sprintf("avatars/%d_%d.jpg", userId, time.Now().Unix())

	avatarURL, err := common.UploadToOSS(objectKey, &buf)
	if err != nil {
		common.ApiErrorMsg(c, "上传失败: "+err.Error())
		return
	}

	if err := model.DB.Model(&model.User{}).Where("id = ?", userId).Update("avatar_url", avatarURL).Error; err != nil {
		common.ApiErrorMsg(c, "保存失败")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    gin.H{"avatar_url": avatarURL},
	})
}

func resizeImage(src image.Image, maxDim int) image.Image {
	bounds := src.Bounds()
	w, h := bounds.Dx(), bounds.Dy()

	if w <= maxDim && h <= maxDim {
		return src
	}

	var newW, newH int
	if w > h {
		newW = maxDim
		newH = h * maxDim / w
	} else {
		newH = maxDim
		newW = w * maxDim / h
	}

	dst := image.NewRGBA(image.Rect(0, 0, newW, newH))
	draw.CatmullRom.Scale(dst, dst.Bounds(), src, bounds, draw.Over, nil)
	return dst
}

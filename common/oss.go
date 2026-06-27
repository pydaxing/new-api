package common

import (
	"fmt"
	"io"
	"os"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
)

var ossClient *oss.Client

func InitOSS() {
	region := os.Getenv("OSS_REGION")
	accessKeyID := os.Getenv("ALIYUN_ACCESS_KEY_ID")
	accessKeySecret := os.Getenv("ALIYUN_ACCESS_KEY_SECRET")

	if region == "" || accessKeyID == "" || accessKeySecret == "" {
		return
	}

	endpoint := fmt.Sprintf("https://%s.aliyuncs.com", region)
	client, err := oss.New(endpoint, accessKeyID, accessKeySecret)
	if err != nil {
		SysLog(fmt.Sprintf("failed to init OSS client: %v", err))
		return
	}
	ossClient = client
}

func OSSEnabled() bool {
	return ossClient != nil
}

func UploadToOSS(objectKey string, reader io.Reader) (string, error) {
	if ossClient == nil {
		return "", fmt.Errorf("OSS not configured")
	}

	bucketName := os.Getenv("OSS_BUCKET")
	if bucketName == "" {
		return "", fmt.Errorf("OSS_BUCKET not set")
	}

	bucket, err := ossClient.Bucket(bucketName)
	if err != nil {
		return "", fmt.Errorf("get bucket: %w", err)
	}

	if err := bucket.PutObject(objectKey, reader); err != nil {
		return "", fmt.Errorf("put object: %w", err)
	}

	region := os.Getenv("OSS_REGION")
	url := fmt.Sprintf("https://%s.%s.aliyuncs.com/%s", bucketName, region, objectKey)
	return url, nil
}

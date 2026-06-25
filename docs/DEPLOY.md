# New-API 部署操作手册

本文档记录 `pydaxing/new-api` 从代码修改到线上可访问的完整操作流程。

---

## 环境信息

| 项目 | 值 |
|------|-----|
| GitHub 仓库 | `git@github.com:pydaxing/new-api.git` |
| 服务器 IP | 101.201.59.92 |
| 服务器系统 | Ubuntu 24.04 x86_64 |
| SSH 用户 | root |
| SSH 密码 | Al017830 |
| 管理面板 | 宝塔面板 `https://101.201.59.92:9510/lengm` |
| 宝塔用户名 | lengm |
| MySQL 密码 | cs985211 |
| MySQL 数据库 | newapi |
| 服务端口 | 3000 |
| 域名 | https://pydaxing.com |
| 部署路径 | /opt/new-api/ |
| 二进制文件 | /opt/new-api/new-api |

---

## 一、修改代码并推送

```bash
cd ~/Workspace/pydaxing/new-api

# 修改代码...

# 提交
git add .
git commit -m "feat: 你的改动描述"
git push origin main
```

---

## 二、打 Tag 触发 GitHub Actions 构建

构建由 `.github/workflows/release.yml` 定义，触发条件：push tag 或手动 workflow_dispatch。

### 2.1 版本号命名规则

格式：`vX.Y.Z-pydaxing`

| 级别 | 场景 | 示例 |
|------|------|------|
| patch（Z） | 小改动、文案修改、bug fix | `v0.1.1-pydaxing` |
| minor（Y） | 新功能、较大改动 | `v0.2.0-pydaxing` |
| major（X） | 重大架构变更、不兼容更新 | `v1.0.0-pydaxing` |

### 2.2 打 Tag 并推送

```bash
# 查看当前最新 tag
git tag --list 'v*-pydaxing' --sort=-v:refname | head -5

# 打新 tag（根据改动级别递增版本号）
git tag v0.1.1-pydaxing
git push origin v0.1.1-pydaxing
```

### 2.3 验证构建状态

```bash
# 查看最近的构建
gh run list --repo pydaxing/new-api --limit 3

# 实时监控构建进度（会等到完成）
gh run watch <run-id> --repo pydaxing/new-api --exit-status
```

等待构建完成（约 5-8 分钟），构建产物会出现在 GitHub Releases 页面：
`https://github.com/pydaxing/new-api/releases`

产物文件名格式：`new-api-v0.1.1-pydaxing`（Linux amd64 二进制）

---

## 三、部署到服务器

### 方式一：本地下载 + scp 上传（推荐，速度快）

国内服务器直连 GitHub 很慢，推荐在本地下载后通过 scp 传到服务器。

#### 3.1 本地下载二进制

```bash
TAG=v0.1.1-pydaxing

# 通过 gh CLI 下载（需要 GitHub 认证）
gh release download ${TAG} --repo pydaxing/new-api --pattern "new-api-${TAG}" --dir /tmp
```

#### 3.2 上传到服务器

```bash
sshpass -p 'Al017830' scp -o StrictHostKeyChecking=no /tmp/new-api-${TAG} root@101.201.59.92:/opt/new-api/new-api-new
```

#### 3.3 SSH 执行部署

```bash
sshpass -p 'Al017830' ssh -o StrictHostKeyChecking=no root@101.201.59.92 \
  'cd /opt/new-api && systemctl stop new-api && chmod +x new-api-new && mv new-api-new new-api && systemctl start new-api && systemctl status new-api --no-pager'
```

### 方式二：服务器直接下载（备选，依赖代理稳定性）

SSH 到服务器后执行：

```bash
TAG=v0.1.1-pydaxing
cd /opt/new-api
systemctl stop new-api
wget https://ghfast.top/https://github.com/pydaxing/new-api/releases/download/${TAG}/new-api-${TAG} -O new-api-new
chmod +x new-api-new
mv new-api-new new-api
systemctl start new-api
```

> 如果 ghfast.top 不可用，可尝试其他镜像：`gh-proxy.com`、`mirror.ghproxy.com` 等。

---

## 四、验证部署

```bash
# 检查服务状态
sshpass -p 'Al017830' ssh root@101.201.59.92 'systemctl status new-api --no-pager'

# 测试本地端口
sshpass -p 'Al017830' ssh root@101.201.59.92 'curl -sI http://localhost:3000 | head -5'
```

确认返回 `HTTP/1.1 200 OK` 后，浏览器访问 https://pydaxing.com 确认页面正常。

---

## 五、完整命令速查（一键更新）

在本地机器上依次执行：

```bash
# 设置版本号
TAG=v0.1.1-pydaxing

# 1. 下载二进制到本地
gh release download ${TAG} --repo pydaxing/new-api --pattern "new-api-${TAG}" --dir /tmp

# 2. 上传到服务器
sshpass -p 'Al017830' scp -o StrictHostKeyChecking=no /tmp/new-api-${TAG} root@101.201.59.92:/opt/new-api/new-api-new

# 3. SSH 部署：停服 → 替换 → 启动 → 验证
sshpass -p 'Al017830' ssh -o StrictHostKeyChecking=no root@101.201.59.92 \
  'cd /opt/new-api && systemctl stop new-api && chmod +x new-api-new && mv new-api-new new-api && systemctl start new-api && systemctl status new-api --no-pager'
```

---

## 六、服务器配置详情（已部署，无需重复操作）

以下记录初次部署时的配置，供参考或重建时使用。

### 6.1 环境变量文件

路径：`/opt/new-api/.env`

```env
PORT=3000
SQL_DSN=root:cs985211@tcp(localhost:3306)/newapi
SESSION_SECRET=d97abb4e7f723a01ea0ecb6206488ca91dda87d542fc674c5c60fce48333b022
```

### 6.2 systemd 服务

路径：`/etc/systemd/system/new-api.service`

```ini
[Unit]
Description=New API Service
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/new-api
ExecStart=/opt/new-api/new-api
EnvironmentFile=/opt/new-api/.env
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

常用命令：

```bash
systemctl start new-api      # 启动
systemctl stop new-api       # 停止
systemctl restart new-api    # 重启
systemctl status new-api     # 查看状态
journalctl -u new-api -f     # 实时查看日志
```

### 6.3 Nginx 反向代理

通过宝塔面板管理，站点名 `pydaxing.com`。

关键配置（宝塔 → 网站 → pydaxing.com → 反向代理 → 配置文件）：

```nginx
location ^~ / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_http_version 1.1;

    # SSE/流式传输支持
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 600s;
}
```

### 6.4 SSL 证书

通过宝塔面板管理（宝塔 → 网站 → pydaxing.com → SSL），支持自动续签。

证书路径：
- 证书：`/www/server/panel/vhost/cert/pydaxing.com/fullchain.pem`
- 私钥：`/www/server/panel/vhost/cert/pydaxing.com/privkey.pem`

---

## 七、故障排查

### 服务启动失败

```bash
# 查看详细错误
journalctl -u new-api --no-pager -n 50

# 常见原因：
# 1. 端口被占用 → lsof -i :3000
# 2. 数据库连接失败 → 检查 MySQL 是否运行: systemctl status mysql
# 3. 权限问题 → chmod +x /opt/new-api/new-api
```

### 网站无法访问

```bash
# 1. 检查服务是否运行
systemctl status new-api

# 2. 检查本地端口
curl http://localhost:3000

# 3. 检查 Nginx 配置
nginx -t
systemctl reload nginx

# 4. 检查防火墙
ufw status
```

### GitHub Actions 构建失败

常见原因：
- `bun.lock` 与 `package.json` 不一致 → 本地运行 `cd web && bun install` 后提交 `bun.lock`
- Go 依赖下载超时 → 重新触发构建即可

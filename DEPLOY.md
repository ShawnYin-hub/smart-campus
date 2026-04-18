# 智能校园系统 - 生产环境部署指南

## 快速开始

### 方式一：一键部署（推荐）

```bash
# Linux/macOS
curl -fsSL https://raw.githubusercontent.com/your-org/smart-campus/main/deploy.sh | bash

# 或先下载脚本赋予执行权限后运行
curl -fsSL https://raw.githubusercontent.com/your-org/smart-campus/main/deploy.sh -o deploy.sh
chmod +x deploy.sh && ./deploy.sh
```

### 方式二：手动部署

```bash
# 1. 克隆项目
git clone https://github.com/your-org/smart-campus.git
cd smart-campus

# 2. 配置环境变量
cp backend/.env.production backend/.env
# 编辑 backend/.env，填写 SECRET_KEY 和 DEEPSEEK_API_KEY

# 3. 一键启动（自动构建镜像并启动所有服务）
docker compose up -d

# 4. 访问系统
# 前端: http://localhost
# API:  http://localhost:8000/docs
```

### 方式三：完全离线部署（已构建镜像）

如果你的服务器无法访问 GitHub/Docker Hub，可以先在本地构建镜像，导出后上传到服务器：

```bash
# 在有网络的机器上构建镜像
docker save -o smart-campus-images.tar \
  smart-campus-frontend:latest \
  smart-campus-backend:latest \
  postgres:16-alpine

# 上传到服务器
scp smart-campus-images.tar user@your-server:/opt/

# 在服务器上加载镜像
docker load -i smart-campus-images.tar

# 启动服务
cd /opt/smart-campus && docker compose up -d
```

## 部署架构

```
┌─────────────────────────────────────────┐
│              Nginx (Port 80)              │
│  前端静态资源  +  API 反向代理            │
└───────────────┬─────────────────────────┘
                │ /api/*  →  http://backend:8000
                ▼
┌─────────────────────────────────────────┐
│         FastAPI Backend (Port 8000)      │
│  认证、用户、简报、审批、AI 风险分析       │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│        PostgreSQL (Port 5432)            │
│           持久化存储                       │
└─────────────────────────────────────────┘
```

## 配置说明

编辑 `backend/.env` 文件：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `SECRET_KEY` | JWT 签名密钥（生产必改） | `openssl rand -hex 64` 生成 |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | 从 platform.deepseek.com 获取 |
| `BACKEND_CORS_ORIGINS` | 允许的请求来源 | `["*"]`（Nginx 代理后同源） |

## 常用运维命令

```bash
# 查看所有服务状态
docker compose ps

# 查看实时日志
docker compose logs -f

# 只看后端日志
docker compose logs -f backend

# 重启所有服务
docker compose restart

# 重启单个服务
docker compose restart backend

# 更新部署（拉取最新代码并重建）
git pull origin main && docker compose up -d --build

# 停止服务（保留数据卷）
docker compose down

# 完全清除（删除数据库数据）
docker compose down -v
```

## 数据备份

PostgreSQL 数据卷 `postgres_data` 包含所有业务数据。

```bash
# 备份
docker compose exec db pg_dump -U postgres smart_campus > backup_$(date +%Y%m%d).sql

# 恢复
docker compose exec -T db psql -U postgres smart_campus < backup_20250101.sql
```

## 修改端口

编辑 `docker-compose.yml` 中的端口映射：

```yaml
services:
  frontend:
    ports:
      - "8080:80"    # 改为 8080
  backend:
    ports:
      - "9000:8000" # 改为 9000
```

## HTTPS 配置

在 Nginx 前放置 Nginx/Caddy 作为反向代理，或使用 Docker volume 挂载证书：

```yaml
# 在 docker-compose.yml 中添加
services:
  frontend:
    volumes:
      - /path/to/certs:/etc/nginx/certs:ro
```

然后修改 `nginx.conf` 添加 SSL 配置。

## 首次登录

1. 启动后系统自动创建默认管理员账户
2. 初始用户名: `admin`
3. 初始密码: 首次启动时打印在控制台日志中（格式: `admin123456`）
4. 登录后请立即修改密码

## 常见问题

**Q: 镜像构建失败？**
检查 Docker 版本（需要 v2+）和网络连接。也可以使用国内镜像加速：

```bash
# 编辑 /etc/docker/daemon.json
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
```

**Q: 数据库连接失败？**
确认 PostgreSQL 健康检查通过后再启动后端：

```bash
docker compose logs db
```

**Q: 端口被占用？**
修改 `docker-compose.yml` 中对应的端口映射。

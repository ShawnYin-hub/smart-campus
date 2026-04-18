"""
智能校园系统 (Smart Campus System) - 后端

基于 Python FastAPI + PostgreSQL 的 RESTful API 后端，为 Web 大屏层提供全部数据接口。

## 快速启动

### 方式一：Docker 部署（推荐）

```bash
# 1. 复制环境变量文件
cp .env.example .env
# 然后编辑 .env，填写以下关键配置：
#   - SECRET_KEY: 运行 python -c "import secrets; print(secrets.token_hex(64))" 生成
#   - DEEPSEEK_API_KEY: 你的 DeepSeek API Key

# 2. 启动全部服务（后端 + PostgreSQL）
docker-compose up -d

# 3. 查看日志确认启动成功
docker-compose logs -f backend

# 4. 访问 API 文档
open http://localhost:8000/docs
```

### 方式二：本地开发

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 启动 PostgreSQL（Docker 或本地安装）
docker run -d \
  --name smart-campus-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=smart_campus \
  -p 5432:5432 \
  postgres:16-alpine

# 3. 配置 .env
cp .env.example .env

# 4. 运行数据库迁移
alembic upgrade head

# 5. 启动开发服务器
uvicorn app.main:app --reload --port 8000
```

## 默认账号

应用启动时会自动创建默认管理员：

- **用户名**: admin
- **密码**: admin123456
- **角色**: admin

> 首次登录后请立即修改密码！

## API 文档

启动后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 数据库迁移

```bash
# 创建新迁移（修改模型后）
alembic revision --autogenerate -m "add new table"

# 执行迁移
alembic upgrade head

# 回滚
alembic downgrade -1
```

## 目录结构

```
backend/
├── app/
│   ├── main.py              # FastAPI 应用入口
│   ├── core/                # 核心配置（config, database, security）
│   ├── models/               # SQLAlchemy 数据模型
│   ├── schemas/              # Pydantic 请求/响应模型
│   ├── services/             # 业务逻辑层（认证、人员、审批、AI）
│   ├── api/routes/           # API 路由
│   └── alembic/              # 数据库迁移
├── .env.example
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

## 环境变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| DATABASE_URL | PostgreSQL 连接字符串 | postgresql+asyncpg://postgres:password@db:5432/smart_campus |
| SECRET_KEY | JWT 签名密钥（生产必须更换） | `python -c "import secrets; print(secrets.token_hex(64))"` |
| DEEPSEEK_API_KEY | DeepSeek API Key | sk-xxxxxxxx |
| BACKEND_CORS_ORIGINS | 前端地址列表 | ["http://localhost:3000"] |
| ACCESS_TOKEN_EXPIRE_MINUTES | Token 过期时间（分钟） | 480 |

## 常用命令

```bash
# 启动
docker-compose up -d

# 停止
docker-compose down

# 查看日志
docker-compose logs -f backend

# 进入后端容器
docker exec -it smart-campus-backend /bin/bash

# 进入数据库
docker exec -it smart-campus-db psql -U postgres -d smart_campus
```

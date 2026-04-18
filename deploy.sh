#!/bin/bash
#
# 智能校园系统 - 一键部署脚本
#
# 用法:
#   # 方式1: 通过 Git 部署（推荐）
#   bash -c "$(curl -fsSL https://your-gist-url/deploy.sh)" -- "https://github.com/your-org/smart-campus.git"
#
#   # 方式2: 直接运行（项目已在当前目录）
#   ./deploy.sh
#
#   # 方式3: 使用 Docker Compose 直接启动
#   curl -fsSL https://raw.githubusercontent.com/your-org/smart-campus/main/deploy.sh | bash -s -- --source "" --git-url "https://github.com/your-org/smart-campus.git"
#

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认值
SOURCE_DIR=""
GIT_URL=""
BRANCH="main"
ENV_FILE=""
PORT_HTTP=80
PORT_API=8000

# 解析参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --source)
                SOURCE_DIR="$2"
                shift 2
                ;;
            --git-url)
                GIT_URL="$2"
                shift 2
                ;;
            --branch)
                BRANCH="$2"
                shift 2
                ;;
            --env-file)
                ENV_FILE="$2"
                shift 2
                ;;
            --port-http)
                PORT_HTTP="$2"
                shift 2
                ;;
            --port-api)
                PORT_API="$2"
                shift 2
                ;;
            --help|-h)
                echo "用法: $0 [选项]"
                echo ""
                echo "选项:"
                echo "  --source DIR      项目源码目录（默认当前目录）"
                echo "  --git-url URL     Git 仓库地址（若源码目录为空）"
                echo "  --branch NAME     Git 分支（默认 main）"
                echo "  --env-file FILE   .env 配置文件路径"
                echo "  --port-http PORT  前端 HTTP 端口（默认 80）"
                echo "  --port-api PORT   后端 API 端口（默认 8000）"
                exit 0
                ;;
            *)
                shift
                ;;
        esac
    done
}

# 检查依赖
check_dependencies() {
    echo -e "${BLUE}[1/6] 检查依赖...${NC}"

    if ! command -v docker &> /dev/null; then
        echo -e "${RED}错误: 未找到 Docker，请先安装 Docker: https://docs.docker.com/get-docker/${NC}"
        exit 1
    fi

    if ! docker compose version &> /dev/null; then
        echo -e "${RED}错误: 未找到 Docker Compose v2，请升级 Docker Desktop 或安装 docker-compose-plugin${NC}"
        exit 1
    fi

    echo -e "${GREEN}  Docker & Docker Compose 检查通过${NC}"
}

# 准备源码目录
prepare_source() {
    echo -e "${BLUE}[2/6] 准备源码...${NC}"

    if [[ -n "$GIT_URL" ]]; then
        # 从 Git 克隆
        TARGET_DIR=$(mktemp -d)
        echo -e "  克隆仓库: ${YELLOW}$GIT_URL${NC}"
        git clone --depth=1 -b "$BRANCH" "$GIT_URL" "$TARGET_DIR"
        SOURCE_DIR="$TARGET_DIR"
    fi

    if [[ -z "$SOURCE_DIR" || ! -d "$SOURCE_DIR" ]]; then
        SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
    fi

    echo -e "  源码目录: ${YELLOW}$SOURCE_DIR${NC}"

    # 检查必要文件
    if [[ ! -f "$SOURCE_DIR/docker-compose.yml" ]]; then
        echo -e "${RED}错误: $SOURCE_DIR 中未找到 docker-compose.yml${NC}"
        exit 1
    fi
}

# 配置环境变量
setup_env() {
    echo -e "${BLUE}[3/6] 配置环境变量...${NC}"

    ENV_PATH="$SOURCE_DIR/backend/.env"

    if [[ -n "$ENV_FILE" && -f "$ENV_FILE" ]]; then
        cp "$ENV_FILE" "$ENV_PATH"
        echo -e "  使用指定配置文件: ${YELLOW}$ENV_FILE${NC}"
    elif [[ -f "$SOURCE_DIR/backend/.env" ]]; then
        echo -e "  使用已有 .env 文件"
    else
        # 使用 .env.production 模板
        if [[ -f "$SOURCE_DIR/backend/.env.production" ]]; then
            cp "$SOURCE_DIR/backend/.env.production" "$ENV_PATH"
            echo -e "  ${YELLOW}已创建 .env，请编辑 $ENV_PATH 填写真实配置${NC}"
            echo -e "  ${YELLOW}尤其是 SECRET_KEY 和 DEEPSEEK_API_KEY${NC}"
        else
            echo -e "${RED}错误: 未找到 .env.production 模板${NC}"
            exit 1
        fi
    fi
}

# 构建并启动
deploy() {
    echo -e "${BLUE}[4/6] 构建 Docker 镜像（首次约需3-5分钟）...${NC}"

    cd "$SOURCE_DIR"

    # 修改 docker-compose.yml 中的端口（可选）
    if [[ "$PORT_HTTP" != "80" || "$PORT_API" != "8000" ]]; then
        echo -e "  调整端口映射: HTTP=$PORT_HTTP, API=$PORT_API"
        # 使用 sed 临时修改端口（不改动源文件）
        export HTTP_PORT="$PORT_HTTP"
        export API_PORT="$PORT_API"
    fi

    # 构建并启动
    echo -e "  开始构建镜像..."
    docker compose build --pull

    echo -e "${BLUE}[5/6] 启动服务...${NC}"
    docker compose up -d

    # 等待服务健康
    echo -e "${BLUE}[6/6] 等待服务启动...${NC}"
    local retries=30
    local count=0
    while [[ $count -lt $retries ]]; do
        if curl -sf http://localhost:$PORT_API/api/v1/health &>/dev/null; then
            echo -e "${GREEN}  后端服务健康检查通过${NC}"
            break
        fi
        count=$((count + 1))
        echo -ne "  等待后端启动... ($count/$retries)\r"
        sleep 2
    done

    if [[ $count -eq $retries ]]; then
        echo -e "\n${YELLOW}警告: 后端健康检查超时，查看日志: docker compose logs backend${NC}"
    fi
}

# 输出结果
show_result() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  部署完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "  前端地址: ${YELLOW}http://localhost:$PORT_HTTP${NC}"
    echo -e "  API 文档: ${YELLOW}http://localhost:$PORT_API/docs${NC}"
    echo -e "  数据库:   ${YELLOW}localhost:5432${NC}"
    echo ""
    echo -e "  常用命令:"
    echo -e "    查看日志:    ${YELLOW}cd $SOURCE_DIR && docker compose logs -f${NC}"
    echo -e "    重启服务:    ${YELLOW}cd $SOURCE_DIR && docker compose restart${NC}"
    echo -e "    停止服务:    ${YELLOW}cd $SOURCE_DIR && docker compose down${NC}"
    echo -e "    更新部署:    ${YELLOW}cd $SOURCE_DIR && git pull && docker compose up -d --build${NC}"
    echo ""
    echo -e "  首次使用请编辑: ${YELLOW}$SOURCE_DIR/backend/.env${NC}"
    echo -e "  设置 SECRET_KEY 和 DEEPSEEK_API_KEY"
    echo ""
}

# 主流程
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  智能校园系统 - 一键部署${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    parse_args "$@"
    check_dependencies
    prepare_source
    setup_env
    deploy
    show_result
}

main "$@"

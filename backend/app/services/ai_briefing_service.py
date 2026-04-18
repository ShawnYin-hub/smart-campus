"""
AI 晨报生成服务（同步版本）
"""
from __future__ import annotations
import json
import httpx

from app.core.config import settings

import logging
logger = logging.getLogger(__name__)


class AIBriefingService:
    """AI 晨报生成服务（同步）"""

    BRIEFING_PROMPT_TEMPLATE = """你是一个校园管理晨报助手。请根据以下数据，为学校管理层生成一份每日晨报。

## 今日数据摘要
- 当前待审批数量：{pending_count} 件
- 高风险审批数量：{high_risk_count} 件
- 今日已处理审批数量：{today_processed} 件
- 昨日同期审批数量：{yesterday_count} 件
- 系统合规率：{compliance_rate}%
- 人脸录入完成率：{face_completion_rate}%
- 全校人员总数：{total_count} 人

## 输出要求
请生成一份自然、专业的晨报，内容包含：
1. 今日整体概况（1-2句）
2. 值得关注的重点事项（如有高风险审批需特别提醒）
3. 数据趋势分析（与昨日对比）
4. 管理建议（1-2条）

最后返回以下 JSON 格式的元数据：
{{"title": "晨报标题（10字以内）", "tags": ["标签1", "标签2"]}}

请先用自然语言写晨报内容，最后另起一行输出 JSON 元数据。"""

    def __init__(self):
        self.model = settings.deepseek_model

    def generate(self, stats: dict) -> tuple:
        """同步生成晨报"""
        if not settings.deepseek_api_key:
            return (
                "今日校园运行正常，各项管理事务稳步推进。AI 晨报服务暂未配置，请联系管理员配置 DeepSeek API Key。",
                "校园晨报",
                ["日常", "AI"],
            )

        prompt = self.BRIEFING_PROMPT_TEMPLATE.format(
            pending_count=stats.get("pending_count", 0),
            high_risk_count=stats.get("high_risk_count", 0),
            today_processed=stats.get("today_processed", 0),
            yesterday_count=stats.get("yesterday_count", 0),
            compliance_rate=stats.get("compliance_rate", 0),
            face_completion_rate=stats.get("face_completion_rate", 0),
            total_count=stats.get("total_count", 0),
        )

        try:
            with httpx.Client(timeout=settings.ai_timeout_seconds) as client:
                response = client.post(
                    f"{settings.deepseek_base_url.rstrip('/')}/chat/completions",
                    json={
                        "model": self.model,
                        "messages": [
                            {
                                "role": "system",
                                "content": "你是一个专业的校园管理晨报助手，语言简洁专业，适合管理层阅读。",
                            },
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.7,
                        "max_tokens": 800,
                    },
                    headers={
                        "Authorization": f"Bearer {settings.deepseek_api_key}",
                        "Content-Type": "application/json",
                    },
                )
                response.raise_for_status()
                raw = response.json()["choices"][0]["message"]["content"].strip()

            # 分离正文和 JSON 元数据
            lines = raw.split("\n")
            json_part = ""
            content_lines = []
            for line in reversed(lines):
                if line.strip().startswith("{"):
                    json_part = line.strip()
                    break
                content_lines.insert(0, line)

            content = "\n".join(content_lines).strip()
            if not content:
                content = "今日校园运行正常，各项管理事务稳步推进。"

            title = "校园晨报"
            tags = ["日常"]
            if json_part:
                try:
                    meta = json.loads(json_part)
                    title = meta.get("title", "校园晨报")
                    tags = meta.get("tags", ["日常"])
                except json.JSONDecodeError:
                    logger.warning("Failed to parse briefing JSON metadata: %s", json_part)

            logger.info("AI briefing generated: %s", title)
            return content, title, tags

        except httpx.TimeoutException:
            logger.error("AI Briefing service timeout after %ds", settings.ai_timeout_seconds)
            return (
                "今日校园运行正常，各项管理事务稳步推进。AI 晨报服务暂时不可用，请稍后再试。",
                "校园晨报",
                ["日常", "AI"],
            )
        except httpx.HTTPStatusError as e:
            logger.error("AI Briefing service HTTP error: %s %s", e.response.status_code, e.response.text[:200])
            return (
                "今日校园运行正常，各项管理事务稳步推进。AI 晨报服务暂时不可用，请稍后再试。",
                "校园晨报",
                ["日常", "AI"],
            )
        except Exception as e:
            logger.exception("AI Briefing service unexpected error: %s", e)
            return (
                "今日校园运行正常，各项管理事务稳步推进。AI 晨报服务暂时不可用，请稍后再试。",
                "校园晨报",
                ["日常", "AI"],
            )

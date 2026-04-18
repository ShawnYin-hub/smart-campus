"""
AI 风控打标服务（同步版本）
使用 DeepSeek API 进行风险评估。
"""
from __future__ import annotations
import json
from typing import Optional
import httpx

from app.core.config import settings

import logging
logger = logging.getLogger(__name__)


class RiskAssessmentResult:
    def __init__(self, risk_level: str, risk_reason: str, alert: bool):
        self.risk_level = risk_level
        self.risk_reason = risk_reason
        self.alert = alert


class AIRiskService:
    """AI 风控打标服务（同步）"""

    RISK_PROMPT_TEMPLATE = """你是一个校园安全风控专家。请根据以下请假申请信息，判断该申请是否为高风险。

申请人姓名：{name}
申请人学号：{student_id}
申请类型：{approval_type}
请假开始时间：{start_time}
请假结束时间：{end_time}
请假事由：{reason}

高风险判断标准（满足任意一项即为高风险）：
- 长时间请假（超过3天）
- 节假日前后请假（周末、法定节假日）
- 夜间外出（22:00后至次日7:00前）
- 请假理由模糊、异常或存在安全隐患
- 同一申请人短期内频繁请假

请返回以下 JSON 格式（不要包含任何其他内容）：
{{"risk_level": "high"或"low", "risk_reason": "判断理由，50字以内", "alert": true或false}}"""

    def assess_sync(
        self,
        name: str,
        student_id: str,
        approval_type: str,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        reason: str = "",
    ) -> RiskAssessmentResult:
        """同步调用 DeepSeek API 进行风险评估"""
        type_display = {
            "leave_school": "离校申请",
            "visitor": "访客申请",
            "other": "其他申请",
        }.get(approval_type, approval_type)

        prompt = self.RISK_PROMPT_TEMPLATE.format(
            name=name,
            student_id=student_id,
            approval_type=type_display,
            start_time=start_time or "未指定",
            end_time=end_time or "未指定",
            reason=reason or "未填写",
        )

        # 如果没有配置 API Key，返回默认低风险
        if not settings.deepseek_api_key:
            logger.info("AI Risk assessment skipped: no API key configured")
            return RiskAssessmentResult(
                risk_level="low",
                risk_reason="AI 服务未配置，已标记为低风险",
                alert=False,
            )

        try:
            with httpx.Client(timeout=settings.ai_timeout_seconds) as client:
                response = client.post(
                    f"{settings.deepseek_base_url.rstrip('/')}/chat/completions",
                    json={
                        "model": settings.deepseek_model,
                        "messages": [
                            {
                                "role": "system",
                                "content": "你是一个严谨的校园安全风控系统，只返回 JSON，不要返回任何其他文字。",
                            },
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.1,
                        "max_tokens": 200,
                    },
                    headers={
                        "Authorization": f"Bearer {settings.deepseek_api_key}",
                        "Content-Type": "application/json",
                    },
                )
                response.raise_for_status()
                raw = response.json()["choices"][0]["message"]["content"].strip()
                if raw.startswith("```"):
                    parts = raw.split("```")
                    raw = parts[1] if len(parts) > 1 else raw
                    if raw.startswith("json"):
                        raw = raw[4:]
                    raw = raw.strip()

                data = json.loads(raw)
                logger.info(
                    "AI risk assessment for %s (%s): %s",
                    name, student_id, data.get("risk_level", "unknown"),
                )
                return RiskAssessmentResult(
                    risk_level=data.get("risk_level", "low"),
                    risk_reason=data.get("risk_reason", ""),
                    alert=data.get("alert", False),
                )
        except httpx.TimeoutException:
            logger.error("AI Risk service timeout after %ds", settings.ai_timeout_seconds)
            return RiskAssessmentResult(
                risk_level="low",
                risk_reason="AI 服务响应超时，已标记为低风险",
                alert=False,
            )
        except httpx.HTTPStatusError as e:
            logger.error("AI Risk service HTTP error: %s %s", e.response.status_code, e.response.text[:200])
            return RiskAssessmentResult(
                risk_level="low",
                risk_reason="AI 服务暂不可用，已标记为低风险",
                alert=False,
            )
        except Exception as e:
            logger.exception("AI Risk service unexpected error: %s", e)
            return RiskAssessmentResult(
                risk_level="low",
                risk_reason="AI 服务暂不可用，已标记为低风险",
                alert=False,
            )

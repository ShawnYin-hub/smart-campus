"""
Schema 数据格式校验模块
集中定义所有字段的验证规则，提高复用性。
"""
import re
from typing import Annotated
from pydantic import AfterValidator, Field


def _validate_id_card(v: str) -> str:
    """校验身份证号格式：15位或18位，含X（允许小写转大写）"""
    if not v:
        return v
    v = v.strip().upper()
    if len(v) == 15:
        if not re.fullmatch(r"\d{15}", v):
            raise ValueError("15位身份证号必须全部为数字")
    elif len(v) == 18:
        if not re.fullmatch(r"\d{17}[\dX]", v):
            raise ValueError("18位身份证号前17位必须为数字，最后一位可为数字或X")
    else:
        raise ValueError("身份证号长度必须为15位或18位")
    return v


def _validate_phone(v: str) -> str:
    """校验中国大陆手机号"""
    if not v:
        return v
    v = v.strip()
    if not re.fullmatch(r"1[3-9]\d{9}", v):
        raise ValueError("手机号格式不正确（中国大陆11位手机号）")
    return v


# 预置注解，方便各处复用
ChineseIdCard = Annotated[str, AfterValidator(_validate_id_card)]
ChinesePhone = Annotated[str, AfterValidator(_validate_phone)]

# role_type 有效枚举值
ROLE_STUDENT = "student"
ROLE_TEACHER = "teacher"
VALID_ROLE_TYPES = {ROLE_STUDENT, ROLE_TEACHER}

# approval type 有效枚举值
APPROVAL_LEAVE = "leave_school"
APPROVAL_VISITOR = "visitor"
APPROVAL_OTHER = "other"
VALID_APPROVAL_TYPES = {APPROVAL_LEAVE, APPROVAL_VISITOR, APPROVAL_OTHER}

#!/usr/bin/env python3
"""
Skill Evaluator
Analyzes user prompts and matches them to available skills.
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class SkillMatch:
    """Represents a matched skill."""
    name: str
    score: float
    matched_keywords: List[str]
    description: str
    path: str


# Skill definitions with trigger keywords
SKILL_DEFINITIONS = {
    "project-bootstrap": {
        "description": "프로젝트 에이전트 팀 구조 생성",
        "keywords_ko": ["에이전트 팀", "팀 만들어", "팀 구성", "팀 생성", "프로젝트 셋업", "프로젝트 설정"],
        "keywords_en": ["agent team", "create team", "setup project", "bootstrap"],
        "priority": 10
    },
    "socrates": {
        "description": "21개 질문으로 요구사항 수집 및 기획 문서 생성",
        "keywords_ko": ["요구사항", "기획", "기획서", "스펙", "명세서", "분석", "정리해", "계획"],
        "keywords_en": ["requirements", "planning", "spec", "specification", "analyze"],
        "priority": 9
    },
    "deep-research": {
        "description": "5개 API 병렬 검색으로 종합 리서치",
        "keywords_ko": ["리서치", "조사", "검색", "찾아", "알아봐", "연구", "딥리서치", "deep dive"],
        "keywords_en": ["research", "search", "find", "investigate", "deep dive", "look up"],
        "priority": 8
    },
    "commit": {
        "description": "Git 커밋 생성",
        "keywords_ko": ["커밋", "커밋해", "저장해"],
        "keywords_en": ["commit", "save changes"],
        "priority": 7
    },
    "code-reviewer": {
        "description": "코드 리뷰 수행",
        "keywords_ko": ["리뷰", "검토", "코드 리뷰", "확인해"],
        "keywords_en": ["review", "code review", "check code"],
        "priority": 7
    },
    "test-automator": {
        "description": "테스트 코드 자동 생성",
        "keywords_ko": ["테스트", "테스트 작성", "테스트 만들어", "단위 테스트", "통합 테스트"],
        "keywords_en": ["test", "write test", "create test", "unit test", "integration test"],
        "priority": 7
    },
    "debugger": {
        "description": "버그 디버깅 및 수정",
        "keywords_ko": ["디버그", "디버깅", "버그", "에러", "오류", "고쳐", "수정해"],
        "keywords_en": ["debug", "bug", "error", "fix", "troubleshoot"],
        "priority": 7
    },
    "refactor": {
        "description": "코드 리팩토링",
        "keywords_ko": ["리팩토링", "리팩터", "개선", "정리"],
        "keywords_en": ["refactor", "improve", "clean up", "reorganize"],
        "priority": 6
    },
    "documentation": {
        "description": "문서화 작업",
        "keywords_ko": ["문서", "문서화", "문서 작성", "README", "주석"],
        "keywords_en": ["document", "documentation", "readme", "comment"],
        "priority": 6
    },
    "build": {
        "description": "프로젝트 빌드",
        "keywords_ko": ["빌드", "빌드해", "컴파일"],
        "keywords_en": ["build", "compile"],
        "priority": 5
    },
    "deploy": {
        "description": "배포 작업",
        "keywords_ko": ["배포", "배포해", "릴리스", "퍼블리시"],
        "keywords_en": ["deploy", "release", "publish"],
        "priority": 5
    }
}


def normalize_text(text: str) -> str:
    """Normalize text for matching."""
    return text.lower().strip()


def calculate_keyword_match(prompt: str, keywords: List[str]) -> Tuple[float, List[str]]:
    """
    Calculate how well keywords match the prompt.
    Returns (score, matched_keywords)
    """
    prompt_normalized = normalize_text(prompt)
    matched = []
    total_score = 0.0

    for keyword in keywords:
        keyword_normalized = normalize_text(keyword)

        # Exact match gets higher score
        if keyword_normalized in prompt_normalized:
            matched.append(keyword)
            # Longer keywords get higher scores
            total_score += len(keyword_normalized) * 2

        # Partial word match
        elif any(word in prompt_normalized for word in keyword_normalized.split()):
            matched.append(keyword + " (partial)")
            total_score += len(keyword_normalized)

    return total_score, matched


def evaluate_skills(prompt: str, skills_dir: Path = None) -> List[SkillMatch]:
    """
    Evaluate which skills match the given prompt.
    Returns list of matching skills sorted by score.
    """
    matches = []

    for skill_name, skill_def in SKILL_DEFINITIONS.items():
        all_keywords = skill_def.get("keywords_ko", []) + skill_def.get("keywords_en", [])

        score, matched_keywords = calculate_keyword_match(prompt, all_keywords)

        if score > 0:
            # Apply priority multiplier
            priority = skill_def.get("priority", 1)
            final_score = score * (1 + priority / 10)

            matches.append(SkillMatch(
                name=skill_name,
                score=final_score,
                matched_keywords=matched_keywords,
                description=skill_def.get("description", ""),
                path=f"~/.claude/skills/{skill_name}/skill.md"
            ))

    # Sort by score descending
    matches.sort(key=lambda x: x.score, reverse=True)

    return matches


def load_custom_skills(skills_dir: Path) -> Dict:
    """Load custom skill definitions from skill.md files."""
    custom_skills = {}

    if not skills_dir.exists():
        return custom_skills

    for skill_path in skills_dir.glob("*/skill.md"):
        try:
            content = skill_path.read_text()

            # Extract YAML frontmatter
            if content.startswith("---"):
                parts = content.split("---", 2)
                if len(parts) >= 3:
                    frontmatter = parts[1]

                    # Parse name and description
                    name_match = re.search(r'name:\s*(.+)', frontmatter)
                    desc_match = re.search(r'description:\s*(.+)', frontmatter)

                    if name_match:
                        skill_name = name_match.group(1).strip()
                        description = desc_match.group(1).strip() if desc_match else ""

                        custom_skills[skill_name] = {
                            "description": description,
                            "path": str(skill_path),
                            "keywords_ko": [],
                            "keywords_en": []
                        }

                        # Extract keywords from description
                        words = re.findall(r'\b\w+\b', description.lower())
                        custom_skills[skill_name]["keywords_ko"] = [w for w in words if len(w) > 2]

        except Exception as e:
            print(f"Warning: Could not parse {skill_path}: {e}", file=sys.stderr)

    return custom_skills


def format_matches(matches: List[SkillMatch], format_type: str = "text") -> str:
    """Format matches for output."""
    if format_type == "json":
        return json.dumps([
            {
                "name": m.name,
                "score": m.score,
                "matched_keywords": m.matched_keywords,
                "description": m.description,
                "path": m.path
            }
            for m in matches
        ], indent=2, ensure_ascii=False)

    # Text format
    if not matches:
        return "No matching skills found."

    lines = []
    lines.append(f"Found {len(matches)} matching skill(s):")
    lines.append("")

    for i, match in enumerate(matches, 1):
        lines.append(f"{i}. {match.name} (score: {match.score:.1f})")
        lines.append(f"   Description: {match.description}")
        lines.append(f"   Matched: {', '.join(match.matched_keywords)}")
        lines.append(f"   Path: {match.path}")
        lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Skill Evaluator - Match prompts to skills")
    parser.add_argument(
        "prompt",
        nargs="?",
        help="User prompt to evaluate"
    )
    parser.add_argument(
        "--skills-dir", "-d",
        default=str(Path.home() / ".claude" / "skills"),
        help="Directory containing skill definitions"
    )
    parser.add_argument(
        "--format", "-f",
        choices=["text", "json"],
        default="text",
        help="Output format"
    )
    parser.add_argument(
        "--top", "-n",
        type=int,
        default=3,
        help="Number of top matches to return"
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List all available skills"
    )

    args = parser.parse_args()

    if args.list:
        print("Available Skills:")
        for name, skill_def in SKILL_DEFINITIONS.items():
            print(f"\n  {name}")
            print(f"    {skill_def['description']}")
            keywords = skill_def.get('keywords_ko', []) + skill_def.get('keywords_en', [])
            print(f"    Keywords: {', '.join(keywords[:5])}...")
        return

    # Read prompt from stdin if not provided
    prompt = args.prompt
    if not prompt:
        if not sys.stdin.isatty():
            prompt = sys.stdin.read().strip()
        else:
            print("Error: No prompt provided")
            sys.exit(1)

    # Evaluate
    matches = evaluate_skills(prompt, Path(args.skills_dir))

    # Limit to top N
    matches = matches[:args.top]

    # Output
    print(format_matches(matches, args.format))


if __name__ == "__main__":
    main()

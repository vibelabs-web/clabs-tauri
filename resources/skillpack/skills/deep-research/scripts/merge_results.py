#!/usr/bin/env python3
"""
Deep Research Results Merger
Combines results from 5 search APIs into a unified format.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import re


def load_json_safe(file_path: str) -> Optional[Dict]:
    """Safely load JSON file."""
    try:
        path = Path(file_path)
        if path.exists():
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        print(f"Warning: Could not load {file_path}: {e}", file=sys.stderr)
    return None


def parse_brave(data: Optional[Dict]) -> List[Dict]:
    """Parse Brave Search results."""
    if not data or 'web' not in data:
        return []

    results = []
    for item in data.get('web', {}).get('results', []):
        results.append({
            'source': 'brave',
            'title': item.get('title', ''),
            'url': item.get('url', ''),
            'snippet': item.get('description', ''),
            'type': 'web'
        })
    return results


def parse_tavily(data: Optional[Dict]) -> Dict:
    """Parse Tavily results."""
    if not data:
        return {'results': [], 'answer': None}

    results = []
    for item in data.get('results', []):
        results.append({
            'source': 'tavily',
            'title': item.get('title', ''),
            'url': item.get('url', ''),
            'snippet': item.get('content', ''),
            'score': item.get('score', 0),
            'type': 'web'
        })

    return {
        'results': results,
        'answer': data.get('answer')
    }


def parse_perplexity(data: Optional[Dict]) -> Dict:
    """Parse Perplexity results."""
    if not data or 'choices' not in data:
        return {'content': None, 'citations': []}

    choice = data.get('choices', [{}])[0]
    message = choice.get('message', {})

    return {
        'content': message.get('content', ''),
        'citations': data.get('citations', [])
    }


def parse_naver(data: Optional[Dict]) -> List[Dict]:
    """Parse Naver Search results."""
    if not data or 'items' not in data:
        return []

    results = []
    for item in data.get('items', []):
        # Clean HTML tags from title and description
        title = re.sub(r'<[^>]+>', '', item.get('title', ''))
        description = re.sub(r'<[^>]+>', '', item.get('description', ''))

        results.append({
            'source': 'naver',
            'title': title,
            'url': item.get('link', ''),
            'snippet': description,
            'type': 'web_kr'
        })
    return results


def parse_youtube(data: Optional[Dict]) -> List[Dict]:
    """Parse YouTube results."""
    if not data or 'items' not in data:
        return []

    results = []
    for item in data.get('items', []):
        snippet = item.get('snippet', {})
        video_id = item.get('id', {}).get('videoId', '')

        results.append({
            'source': 'youtube',
            'title': snippet.get('title', ''),
            'url': f'https://www.youtube.com/watch?v={video_id}' if video_id else '',
            'snippet': snippet.get('description', ''),
            'thumbnail': snippet.get('thumbnails', {}).get('medium', {}).get('url', ''),
            'channel': snippet.get('channelTitle', ''),
            'published': snippet.get('publishedAt', ''),
            'type': 'video'
        })
    return results


def deduplicate_results(results: List[Dict]) -> List[Dict]:
    """Remove duplicate results based on URL."""
    seen_urls = set()
    unique = []

    for item in results:
        url = item.get('url', '')
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique.append(item)

    return unique


def merge_results(
    brave_path: str = None,
    tavily_path: str = None,
    perplexity_path: str = None,
    naver_path: str = None,
    youtube_path: str = None
) -> Dict:
    """Merge results from all sources."""

    merged = {
        'timestamp': datetime.now().isoformat(),
        'sources': {
            'brave': {'status': 'missing', 'count': 0},
            'tavily': {'status': 'missing', 'count': 0},
            'perplexity': {'status': 'missing', 'count': 0},
            'naver': {'status': 'missing', 'count': 0},
            'youtube': {'status': 'missing', 'count': 0},
        },
        'web_results': [],
        'video_results': [],
        'ai_analysis': {
            'tavily_answer': None,
            'perplexity_analysis': None,
            'perplexity_citations': []
        },
        'total_results': 0,
        'unique_results': 0
    }

    all_web_results = []

    # Process Brave
    if brave_path:
        brave_data = load_json_safe(brave_path)
        brave_results = parse_brave(brave_data)
        if brave_results:
            merged['sources']['brave'] = {'status': 'success', 'count': len(brave_results)}
            all_web_results.extend(brave_results)
        elif brave_data:
            merged['sources']['brave'] = {'status': 'error', 'count': 0}

    # Process Tavily
    if tavily_path:
        tavily_data = load_json_safe(tavily_path)
        tavily_parsed = parse_tavily(tavily_data)
        if tavily_parsed['results']:
            merged['sources']['tavily'] = {'status': 'success', 'count': len(tavily_parsed['results'])}
            all_web_results.extend(tavily_parsed['results'])
            if tavily_parsed['answer']:
                merged['ai_analysis']['tavily_answer'] = tavily_parsed['answer']
        elif tavily_data:
            merged['sources']['tavily'] = {'status': 'error', 'count': 0}

    # Process Perplexity
    if perplexity_path:
        perplexity_data = load_json_safe(perplexity_path)
        perplexity_parsed = parse_perplexity(perplexity_data)
        if perplexity_parsed['content']:
            merged['sources']['perplexity'] = {'status': 'success', 'count': 1}
            merged['ai_analysis']['perplexity_analysis'] = perplexity_parsed['content']
            merged['ai_analysis']['perplexity_citations'] = perplexity_parsed['citations']
        elif perplexity_data:
            merged['sources']['perplexity'] = {'status': 'error', 'count': 0}

    # Process Naver
    if naver_path:
        naver_data = load_json_safe(naver_path)
        naver_results = parse_naver(naver_data)
        if naver_results:
            merged['sources']['naver'] = {'status': 'success', 'count': len(naver_results)}
            all_web_results.extend(naver_results)
        elif naver_data:
            merged['sources']['naver'] = {'status': 'error', 'count': 0}

    # Process YouTube
    if youtube_path:
        youtube_data = load_json_safe(youtube_path)
        youtube_results = parse_youtube(youtube_data)
        if youtube_results:
            merged['sources']['youtube'] = {'status': 'success', 'count': len(youtube_results)}
            merged['video_results'] = youtube_results
        elif youtube_data:
            merged['sources']['youtube'] = {'status': 'error', 'count': 0}

    # Deduplicate web results
    merged['total_results'] = len(all_web_results) + len(merged['video_results'])
    merged['web_results'] = deduplicate_results(all_web_results)
    merged['unique_results'] = len(merged['web_results']) + len(merged['video_results'])

    return merged


def format_report(merged: Dict) -> str:
    """Format merged results as a readable report."""
    lines = []
    lines.append("=" * 60)
    lines.append("DEEP RESEARCH RESULTS")
    lines.append("=" * 60)
    lines.append(f"Timestamp: {merged['timestamp']}")
    lines.append("")

    # Source Status
    lines.append("## API Status")
    for source, info in merged['sources'].items():
        status_icon = "✅" if info['status'] == 'success' else "❌" if info['status'] == 'error' else "⏸️"
        lines.append(f"  {status_icon} {source.capitalize()}: {info['count']} results")
    lines.append("")
    lines.append(f"Total: {merged['total_results']} → Unique: {merged['unique_results']}")
    lines.append("")

    # AI Analysis
    if merged['ai_analysis']['tavily_answer'] or merged['ai_analysis']['perplexity_analysis']:
        lines.append("## AI Analysis")

        if merged['ai_analysis']['tavily_answer']:
            lines.append("\n### Tavily Summary")
            lines.append(merged['ai_analysis']['tavily_answer'][:500] + "...")

        if merged['ai_analysis']['perplexity_analysis']:
            lines.append("\n### Perplexity Analysis")
            lines.append(merged['ai_analysis']['perplexity_analysis'][:500] + "...")

        lines.append("")

    # Top Web Results
    if merged['web_results']:
        lines.append("## Top Web Results")
        for i, result in enumerate(merged['web_results'][:10], 1):
            lines.append(f"\n{i}. [{result['source'].upper()}] {result['title']}")
            lines.append(f"   {result['url']}")
            if result.get('snippet'):
                lines.append(f"   {result['snippet'][:150]}...")

    # Video Results
    if merged['video_results']:
        lines.append("\n## Video Results")
        for i, result in enumerate(merged['video_results'][:5], 1):
            lines.append(f"\n{i}. {result['title']}")
            lines.append(f"   {result['url']}")
            lines.append(f"   Channel: {result['channel']}")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Merge Deep Research results")
    parser.add_argument("--brave", help="Path to Brave results JSON")
    parser.add_argument("--tavily", help="Path to Tavily results JSON")
    parser.add_argument("--perplexity", help="Path to Perplexity results JSON")
    parser.add_argument("--naver", help="Path to Naver results JSON")
    parser.add_argument("--youtube", help="Path to YouTube results JSON")
    parser.add_argument("--output", "-o", help="Output file path")
    parser.add_argument("--format", choices=["json", "text"], default="json",
                        help="Output format (default: json)")

    args = parser.parse_args()

    merged = merge_results(
        brave_path=args.brave,
        tavily_path=args.tavily,
        perplexity_path=args.perplexity,
        naver_path=args.naver,
        youtube_path=args.youtube
    )

    if args.format == "text":
        output = format_report(merged)
    else:
        output = json.dumps(merged, indent=2, ensure_ascii=False)

    if args.output:
        Path(args.output).write_text(output, encoding='utf-8')
        print(f"Results saved to: {args.output}")
    else:
        print(output)


if __name__ == "__main__":
    main()

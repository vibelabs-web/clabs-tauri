# 五柱 가중치 조정 가이드

## 기본 가중치

| 柱 | 기본 가중치 | 조정 범위 |
|----|------------|----------|
| 眞 (Truth) | 35% | 25-45% |
| 善 (Goodness) | 35% | 25-45% |
| 美 (Beauty) | 20% | 10-30% |
| 孝 (Serenity) | 8% | 5-15% |
| 永 (Eternity) | 2% | 1-5% |

## 프로젝트 유형별 권장 가중치

### 금융/의료 (안전 중심)

```yaml
weights:
  truth: 30%      # 타입 안전성 중요
  goodness: 45%   # 보안 최우선 ↑
  beauty: 15%
  serenity: 8%
  eternity: 2%
```

### 스타트업 MVP (속도 중심)

```yaml
weights:
  truth: 30%
  goodness: 25%   # 최소한의 보안
  beauty: 25%     # UX 중요 ↑
  serenity: 15%   # 유지보수성 ↑
  eternity: 5%
```

### 엔터프라이즈 (장기 유지)

```yaml
weights:
  truth: 35%
  goodness: 30%
  beauty: 15%
  serenity: 12%   # 유지보수 ↑
  eternity: 8%    # 지속가능성 ↑
```

## 가중치 조정 규칙

1. 眞 + 善 ≥ 60% (핵심 품질 보장)
2. 永 ≤ 5% (과도한 미래 고려 방지)
3. 전체 합 = 100%

## 설정 방법

```yaml
# .claude/config/trinity.yaml
pillar_weights:
  truth: 0.35
  goodness: 0.35
  beauty: 0.20
  serenity: 0.08
  eternity: 0.02
```

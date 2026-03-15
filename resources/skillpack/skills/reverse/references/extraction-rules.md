# 역추출 규칙

## 도메인 리소스 추출

### SQLAlchemy (Python)

```python
# 감지 패턴
class ModelName(Base):
    __tablename__ = "table_name"
    column = Column(Type, ...)

# 추출 매핑
Column(Integer) → type: integer
Column(String)  → type: string
Column(Boolean) → type: boolean
Column(DateTime) → type: datetime
nullable=False  → required: true
unique=True     → unique: true
ForeignKey(...) → relation 감지
```

### Prisma (TypeScript)

```prisma
# 감지 패턴
model ModelName {
  field Type @...
}

# 추출 매핑
Int     → type: integer
String  → type: string
Boolean → type: boolean
DateTime → type: datetime
@id     → primary: true
@unique → unique: true
?       → required: false
```

### Django ORM

```python
# 감지 패턴
class Model(models.Model):
    field = models.FieldType(...)

# 추출 매핑
IntegerField    → type: integer
CharField       → type: string
BooleanField    → type: boolean
DateTimeField   → type: datetime
null=False      → required: true
unique=True     → unique: true
ForeignKey(...) → relation 감지
```

## API 추출

### FastAPI

```python
# 감지 패턴
@router.method("/path/{param}")
async def handler(param: Type) -> ResponseType:
    ...

# 추출 항목
- HTTP method
- URL path
- Path parameters
- Query parameters (from Query())
- Body (from Body() or Pydantic model)
- Response model
- HTTPException → error responses
```

### Express

```javascript
# 감지 패턴
router.method('/path/:param', handler)

# 추출 항목 (JSDoc 의존)
/**
 * @param {type} param
 * @returns {type}
 */
```

## 화면 추출

### React

```tsx
# 컴포넌트 감지
export function/const ComponentName() { ... }

# 데이터 요구사항 감지
useQuery(['key'], fetchFn)
useSWR('key', fetcher)
useState<Type>(initial)

# 레이아웃 감지
className="grid|flex|..."
<Layout>, <Container>, ...
```

### Next.js App Router

```tsx
# 페이지 감지
app/route/page.tsx

# 데이터 요구사항
async function getData() { ... }
use(fetchFn)
```

## 신뢰도 계산

```
confidence =
  type_hints * 0.3 +
  test_coverage * 0.2 +
  documentation * 0.2 +
  consistent_patterns * 0.2 +
  explicit_contracts * 0.1
```

각 요소는 0.0 ~ 1.0 범위

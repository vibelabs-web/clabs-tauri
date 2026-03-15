# 검증 명령어 레퍼런스

## 언어별 검증 명령어

### JavaScript / TypeScript

```bash
# 테스트
npm test
npm run test
yarn test
pnpm test
npx vitest run
npx jest

# 빌드
npm run build
yarn build
npx tsc
npx vite build
npx next build

# 린트
npm run lint
npx eslint .
npx eslint . --ext .ts,.tsx

# 타입체크
npx tsc --noEmit
npm run typecheck
```

### Python

```bash
# 테스트
pytest
pytest -v
pytest --tb=short
python -m pytest
python -m unittest discover

# 빌드
python -m build
pip install -e .
python setup.py build

# 린트
ruff check .
flake8
pylint src/
black --check .

# 타입체크
mypy .
mypy src/
pyright
```

### Go

```bash
# 테스트
go test ./...
go test -v ./...
go test -race ./...
go test -cover ./...

# 빌드
go build ./...
go build -o bin/app .

# 린트
golangci-lint run
go vet ./...
staticcheck ./...
```

### Rust

```bash
# 테스트
cargo test
cargo test --all-features
cargo test -- --nocapture

# 빌드
cargo build
cargo build --release
cargo check

# 린트
cargo clippy
cargo clippy -- -D warnings
cargo fmt --check
```

### Java / Kotlin

```bash
# 테스트 (Maven)
mvn test
mvn verify

# 테스트 (Gradle)
./gradlew test
./gradlew check

# 빌드 (Maven)
mvn package
mvn compile

# 빌드 (Gradle)
./gradlew build
./gradlew assemble
```

---

## 프레임워크별 명령어

### React / Next.js

```bash
# 테스트
npm test
npx vitest run
npx jest

# 빌드
npm run build
npx next build

# 린트
npm run lint
npx next lint
```

### FastAPI

```bash
# 테스트
pytest
pytest tests/ -v

# 타입체크
mypy app/

# 린트
ruff check app/
```

### Django

```bash
# 테스트
python manage.py test
pytest

# 체크
python manage.py check
python manage.py check --deploy
```

### Express / NestJS

```bash
# 테스트
npm test
npx jest

# 빌드
npm run build
npx tsc
```

---

## 성공 조건 판별

### 테스트

```bash
# 성공: 출력에 다음이 포함
# - "0 failed"
# - "All tests passed"
# - "PASSED" (모든 라인)
# - exit code 0

# 실패: 출력에 다음이 포함
# - "failed"
# - "FAILED"
# - "Error"
# - exit code != 0
```

### 빌드

```bash
# 성공
# - exit code 0
# - "Build successful"
# - "Compiled successfully"

# 실패
# - exit code != 0
# - "error:"
# - "Error:"
# - "failed"
```

### 린트

```bash
# 성공
# - "0 errors"
# - "No issues found"
# - exit code 0

# 실패
# - "error" 포함
# - 숫자 + "error(s)"
# - exit code != 0
```

### 타입체크

```bash
# 성공
# - exit code 0
# - "Found 0 errors"
# - 출력 없음 (tsc)

# 실패
# - exit code != 0
# - "error TS"
# - "error:"
```

---

## 출력 파싱 패턴

### 테스트 실패 수 추출

```bash
# Jest
grep -oP '\d+(?= failed)' output.txt

# Pytest
grep -oP '\d+(?= failed)' output.txt

# Go
grep -c "FAIL" output.txt

# Vitest
grep -oP '\d+(?= failed)' output.txt
```

### 에러 위치 추출

```bash
# TypeScript
grep -oP '[^/]+\.tsx?:\d+:\d+' output.txt

# Python
grep -oP 'File "[^"]+", line \d+' output.txt

# Go
grep -oP '[^/]+\.go:\d+:\d+' output.txt
```

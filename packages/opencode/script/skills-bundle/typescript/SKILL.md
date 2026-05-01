---
name: typescript
description: TypeScript 타입 패턴, 유틸리티 타입, 에러 처리. TS 코드 작성 및 타입 오류 해결 시 로드.
---

# TypeScript Best Practices

## 타입 정의 원칙

- `any` 사용 금지. 대신 `unknown` 사용 후 타입 가드로 좁히기.
- `as` 타입 단언은 최소화. 불가피한 경우 `as unknown as T` 대신 타입 가드 사용.
- 인터페이스보다 `type` alias를 선호 (확장성이 필요한 경우만 `interface`).
- 함수 반환 타입은 명시적으로 작성.

## 유용한 유틸리티 타입

```typescript
// 일부 필드만 optional로
type PartialUser = Partial<User>

// 일부 필드만 required로
type RequiredId = Required<Pick<User, 'id'>>

// 읽기 전용
type ReadonlyConfig = Readonly<Config>

// 특정 키 제외
type WithoutPassword = Omit<User, 'password'>

// 특정 키만 선택
type Credentials = Pick<User, 'email' | 'password'>

// 판별 유니언 (Discriminated Union)
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

## 에러 처리 패턴

```typescript
// Result 타입으로 예외 없는 에러 처리
function divide(a: number, b: number): Result<number> {
  if (b === 0) return { success: false, error: "Division by zero" }
  return { success: true, data: a / b }
}

const result = divide(10, 2)
if (result.success) {
  console.log(result.data) // number로 타입 추론됨
} else {
  console.error(result.error)
}
```

## 타입 가드

```typescript
function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as any).id === "string"
  )
}

// 사용
const data: unknown = JSON.parse(raw)
if (isUser(data)) {
  console.log(data.id) // User 타입으로 좁혀짐
}
```

## 비동기 패턴

```typescript
// async/await + 에러 처리
async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const res = await fetch(`/api/users/${id}`)
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` }
    const data: unknown = await res.json()
    if (!isUser(data)) return { success: false, error: "Invalid response shape" }
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}
```

## 제네릭 활용

```typescript
// 재사용 가능한 페이지네이션 응답 타입
type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

// 함수 오버로드 대신 제네릭
function first<T>(arr: T[]): T | undefined {
  return arr[0]
}
```

## 금지 패턴

```typescript
// ❌ any 사용
function process(data: any) { ... }

// ✅ unknown + 타입 가드
function process(data: unknown) {
  if (isValidData(data)) { ... }
}

// ❌ non-null assertion 남발
const el = document.getElementById("app")!

// ✅ 명시적 검사
const el = document.getElementById("app")
if (!el) throw new Error("app element not found")
```

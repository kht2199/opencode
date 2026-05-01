---
name: debugging
description: 체계적인 버그 추적 및 디버깅 절차. 원인 불명 버그, 재현 불가 오류, 성능 문제 분석 시 로드.
---

# Debugging

## 디버깅 절차

1. **재현** — 버그를 일관되게 재현할 수 있는 최소한의 조건을 찾는다.
2. **격리** — 문제가 발생하는 코드 범위를 좁힌다. (이진 탐색: 중간을 비활성화해 어느 쪽에 문제가 있는지 확인)
3. **가설** — 원인에 대한 가설을 세운다. 가능한 원인을 목록으로 작성.
4. **검증** — 가설을 하나씩 테스트한다. 로그, 단위 테스트, 어서션 활용.
5. **수정** — 근본 원인을 수정한다. 증상만 고치는 임시방편 금지.
6. **회귀 테스트** — 수정 후 동일한 버그가 다시 발생하지 않도록 테스트 추가.

## 흔한 버그 유형과 확인 포인트

### 비동기/타이밍 문제
- race condition: 두 비동기 작업이 공유 상태를 동시에 수정하는가?
- 이벤트 핸들러가 cleanup 없이 중복 등록되는가?
- Promise가 reject됐을 때 catch 없이 무시되는가?

### 상태 관리 문제
- 불변성 위반: 객체/배열을 직접 수정하는가?
- 상태 초기화가 올바른 시점에 이루어지는가?
- 이전 렌더/요청의 상태가 남아있는가?

### 타입 관련
- `null` / `undefined`를 가정하지 않고 사용하는가?
- 숫자 타입 혼용 (`number` vs `string`): API 응답의 id가 문자열인가 숫자인가?
- 배열 인덱스 범위 초과

### 네트워크/API
- 요청 헤더, 인증 토큰 누락
- 응답 구조가 변경됐는가?
- 타임아웃 설정 미비

## 디버깅 도구 활용

```typescript
// 중간 값 확인 — 제거하기 쉽도록 TODO 표시
console.log("TODO:remove", { value, type: typeof value })

// 조건부 중단점 대체
if (suspiciousCondition) {
  debugger // 브라우저/Node.js 디버거에서 중단
}

// 스택 추적 출력
console.trace("여기서 호출됨")

// 객체 깊이 출력 (Node.js)
console.dir(obj, { depth: null })
```

## 성능 디버깅

```typescript
// 실행 시간 측정
console.time("operation")
await heavyOperation()
console.timeEnd("operation")

// 함수 호출 횟수 측정
console.count("renderCount")
```

## 버그 리포트 작성 시 포함할 정보

```
환경: OS, Node/Bun 버전, 브라우저(해당시)
재현 절차:
  1. ...
  2. ...
기대 동작: ...
실제 동작: ...
오류 메시지: (전체 스택 트레이스 포함)
재현 빈도: 항상 / 간헐적
```

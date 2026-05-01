---
name: sql
description: SQL 쿼리 작성, 인덱스 최적화, 트랜잭션 패턴. DB 쿼리 작성 및 성능 튜닝 시 로드.
---

# SQL Best Practices

## 쿼리 작성 원칙

- `SELECT *` 금지 — 필요한 컬럼만 명시
- 서브쿼리보다 JOIN 선호 (가독성 + 옵티마이저 활용)
- WHERE 조건의 컬럼에 함수 적용 금지 (인덱스 무력화)
- LIMIT 없는 대용량 테이블 조회 금지

## 인덱스 전략

```sql
-- 복합 인덱스: 자주 함께 사용되는 컬럼을 왼쪽에서 오른쪽으로
-- (user_id, created_at) 인덱스는 user_id 단독 조회도 지원
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);

-- 커버링 인덱스: SELECT 컬럼까지 인덱스에 포함 (테이블 접근 불필요)
CREATE INDEX idx_users_email_name ON users(email, name);

-- 부분 인덱스: 조건에 맞는 행만 인덱싱 (인덱스 크기 감소)
CREATE INDEX idx_active_users ON users(email) WHERE deleted_at IS NULL;
```

### 인덱스가 사용되지 않는 패턴

```sql
-- ❌ 컬럼에 함수 적용
WHERE YEAR(created_at) = 2024

-- ✅ 범위 조건으로 변경
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'

-- ❌ 암묵적 타입 변환
WHERE user_id = '123'  -- user_id가 INT인 경우

-- ✅ 타입 일치
WHERE user_id = 123

-- ❌ LIKE 앞자리 와일드카드
WHERE name LIKE '%김'

-- ✅ 앞자리 고정 (전문 검색이 필요하면 FULLTEXT 인덱스)
WHERE name LIKE '김%'
```

## 트랜잭션 패턴

```sql
-- 기본 패턴
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- 에러 시 롤백
BEGIN;
  UPDATE orders SET status = 'processing' WHERE id = ?;
  INSERT INTO order_logs(order_id, action) VALUES (?, 'status_change');
  -- 실패 시
  ROLLBACK;
  -- 성공 시
  COMMIT;
```

## N+1 문제 해결

```sql
-- ❌ N+1: 주문 목록 조회 후 각 주문의 사용자를 별도 조회
SELECT * FROM orders;
-- 루프: SELECT * FROM users WHERE id = ?  (N번 실행)

-- ✅ JOIN으로 한 번에 조회
SELECT o.*, u.name, u.email
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.status = 'pending';

-- ✅ IN으로 배치 조회
SELECT * FROM users WHERE id IN (1, 2, 3, ...);
```

## 페이지네이션

```sql
-- ❌ OFFSET 페이지네이션 (대용량에서 느림)
SELECT * FROM posts ORDER BY id DESC LIMIT 20 OFFSET 10000;

-- ✅ 커서 기반 페이지네이션 (일정한 성능)
SELECT * FROM posts
WHERE id < :last_id
ORDER BY id DESC
LIMIT 20;
```

## EXPLAIN 읽기 (MySQL/PostgreSQL)

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 123;
```

| 항목 | 나쁜 신호 | 좋은 신호 |
|---|---|---|
| type (MySQL) | ALL (전체 스캔) | ref, eq_ref, const |
| rows | 수백만 | 소수 |
| Extra | Using filesort, Using temporary | Using index |
| PostgreSQL cost | 높은 cost 추정 | 낮은 cost |

---
name: git-workflow
description: Git 브랜치 전략, 커밋 메시지 작성, PR 흐름. 커밋, 브랜치, 머지, 리베이스 작업 시 로드.
---

# Git Workflow

## 브랜치 전략

- `main` / `master` — 배포 가능한 안정 브랜치. 직접 푸시 금지.
- `dev` / `develop` — 통합 브랜치. feature 브랜치의 머지 대상.
- `feature/<이슈번호>-<설명>` — 기능 개발 브랜치. 예: `feature/42-user-login`
- `fix/<이슈번호>-<설명>` — 버그 수정 브랜치. 예: `fix/99-null-pointer`
- `hotfix/<설명>` — 운영 긴급 수정. main에서 분기, main과 dev 양쪽에 머지.

## 커밋 메시지 규칙 (Conventional Commits)

```
<type>(<scope>): <subject>

[본문 — 선택]

[footer — 선택]
```

### type 목록

| type | 설명 |
|---|---|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 동작 변경 없는 코드 개선 |
| `test` | 테스트 추가/수정 |
| `docs` | 문서만 변경 |
| `chore` | 빌드, 설정 등 기타 |
| `perf` | 성능 개선 |
| `ci` | CI/CD 설정 변경 |

### 예시

```
feat(auth): 소셜 로그인 Google OAuth 추가

사용자가 Google 계정으로 로그인할 수 있습니다.
기존 이메일 로그인과 병행 지원.

Closes #123
```

## 일반적인 워크플로

```bash
# 1. 최신 dev 기준으로 브랜치 생성
git checkout dev && git pull
git checkout -b feature/42-user-login

# 2. 작업 후 커밋
git add <files>
git commit -m "feat(auth): 사용자 로그인 기능 추가"

# 3. dev에 리베이스 후 푸시
git fetch origin
git rebase origin/dev
git push -u origin feature/42-user-login

# 4. PR 생성 (GitHub CLI)
gh pr create --base dev --title "feat(auth): 사용자 로그인 기능 추가"
```

## 머지 전 체크리스트

- [ ] 테스트 모두 통과
- [ ] `dev` 기준으로 리베이스 완료
- [ ] 불필요한 console.log, debug 코드 제거
- [ ] PR 설명에 변경 이유 기재

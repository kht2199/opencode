# opencode 온프레미스 사용 가이드 (Windows Git Bash)

## 준비물

- Windows Git Bash
- `opencode.exe` (빌드 방법은 아래 참고)
- 사내 LLM API 엔드포인트 (OpenAI 호환)
- (선택) `rg.exe` — 파일 검색 기능 사용 시 필요

---

## 빌드 방법

macOS 또는 Linux에서 Windows용 바이너리를 빌드합니다.

```bash
cd packages/opencode
bun run script/build-windows.ts --skip-embed-web-ui --skip-install
```

결과물: `packages/opencode/dist/opencode-windows-x64/bin/opencode.exe`

---

## 환경변수 설정

### 필수 설정

| 환경변수 | 설명 |
|---|---|
| `OPENAI_API_KEY` | 사내 LLM API 키 |

### 선택 설정

| 환경변수 | 기본값 | 설명 |
|---|---|---|
| `OPENCODE_SERVER_PASSWORD` | (없음) | 서버 모드 사용 시 Basic Auth 비밀번호 |
| `OPENCODE_SERVER_USERNAME` | `opencode` | 서버 모드 사용 시 Basic Auth 사용자명 |
| `OPENCODE_ALLOWED_PROVIDERS` | `openai-compatible` | 허용할 provider 목록 (콤마 구분) |

### Git Bash에서 환경변수 적용

**일시적 설정 (현재 세션만):**
```bash
export OPENAI_API_KEY="your-api-key"
```

**영구 설정 (`~/.bashrc`에 추가):**
```bash
echo 'export OPENAI_API_KEY="your-api-key"' >> ~/.bashrc
source ~/.bashrc
```

---

## opencode.json 설정

프로젝트 루트 또는 홈 디렉토리(`~/.config/opencode/opencode.json`)에 설정 파일을 생성합니다.

```json
{
  "provider": {
    "openai-compatible": {
      "name": "사내 LLM",
      "options": {
        "baseURL": "https://your-internal-llm.company.com/v1",
        "apiKey": "your-api-key",
        "headers": {
          "X-Custom-Header": "value"
        }
      },
      "models": {
        "your-model-id": {
          "name": "사내 모델",
          "contextLength": 128000
        }
      }
    }
  },
  "model": "openai-compatible/your-model-id"
}
```

> **참고:** `apiKey`는 `opencode.json` 대신 환경변수 `OPENAI_API_KEY`로 설정해도 됩니다.

---

## 실행 방법

### TUI 모드 (기본)

```bash
./opencode.exe
```

터미널 UI가 열리면서 바로 사용할 수 있습니다.

### 특정 디렉토리에서 실행

```bash
cd /c/Users/yourname/project
/path/to/opencode.exe
```

### 서버 모드 (헤드리스)

```bash
export OPENCODE_SERVER_PASSWORD="secure-password"
./opencode.exe serve --port 4096
```

---

## TUI 키보드 단축키

`<leader>` 키는 기본값 `Ctrl+X`입니다. 즉, `<leader>n` = `Ctrl+X` 누른 뒤 `n`.

### 앱 전체

| 단축키 | 동작 |
|---|---|
| `Ctrl+C` / `Ctrl+D` | 앱 종료 |
| `Ctrl+P` | 명령어 목록 |
| `<leader>b` | 사이드바 토글 |
| `<leader>s` | 상태 보기 |

### 세션

| 단축키 | 동작 |
|---|---|
| `<leader>n` | 새 세션 |
| `<leader>l` | 세션 목록 |
| `<leader>g` | 세션 타임라인 |
| `Ctrl+R` | 세션 이름 변경 |
| `Ctrl+D` | 세션 삭제 |
| `Escape` | 현재 응답 중단 |
| `<leader>c` | 세션 압축 (컨텍스트 절약) |
| `<leader>x` | 세션 내보내기 |

### 모델

| 단축키 | 동작 |
|---|---|
| `<leader>m` | 모델 목록 |
| `Ctrl+A` | provider 목록 |
| `F2` | 최근 사용 모델 전환 |
| `Ctrl+T` | 모델 variant 순환 |

### 에이전트

| 단축키 | 동작 |
|---|---|
| `Tab` | 다음 에이전트 |
| `Shift+Tab` | 이전 에이전트 |
| `<leader>a` | 에이전트 목록 |

### 입력창

| 단축키 | 동작 |
|---|---|
| `Enter` | 메시지 전송 |
| `Shift+Enter` / `Ctrl+Enter` | 줄바꿈 입력 |
| `Ctrl+V` | 클립보드 붙여넣기 |
| `Ctrl+C` | 입력창 초기화 |
| `Ctrl+K` | 커서 뒤 내용 삭제 |
| `Ctrl+U` | 커서 앞 내용 삭제 |
| `Ctrl+Z` | 되돌리기 (Windows) |

### 메시지 스크롤

| 단축키 | 동작 |
|---|---|
| `PageUp` | 한 페이지 위 |
| `PageDown` | 한 페이지 아래 |
| `Home` | 첫 메시지로 이동 |
| `End` | 마지막 메시지로 이동 |
| `<leader>y` | 메시지 복사 |
| `<leader>u` | 메시지 되돌리기 |

### 기타

| 단축키 | 동작 |
|---|---|
| `<leader>e` | 외부 에디터 열기 |
| `<leader>t` | 테마 목록 |
| `<leader>h` | 코드 블록 숨기기/보이기 |

---

## ripgrep 설치 (파일 검색 기능)

파일 검색 기능을 사용하려면 `rg.exe`가 PATH에 있어야 합니다.  
자동 다운로드는 보안 정책상 비활성화되어 있으므로 수동 설치가 필요합니다.

```bash
# winget 사용
winget install BurntSushi.ripgrep

# 또는 공식 릴리스에서 직접 다운로드:
# https://github.com/BurntSushi/ripgrep/releases
```

---

## 보안 설정 기본값

온프레미스 배포 시 아래 항목이 기본으로 차단되어 있습니다.

| 항목 | 상태 |
|---|---|
| 자동 업데이트 | 차단 |
| LSP 서버 다운로드 | 차단 |
| 모델 목록 외부 fetch | 차단 |
| 외부 skills | 차단 |
| 대화 외부 공유 | 차단 |
| ripgrep 자동 다운로드 | 차단 |
| 웹 검색 | 차단 |
| 기본 허용 provider | `openai-compatible` 만 |

비활성화가 필요한 항목은 환경변수를 `false`로 설정하여 해제할 수 있습니다.  
예: `OPENCODE_DISABLE_SHARE=false` → 공유 기능 활성화

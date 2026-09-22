# server/AGENTS.md

## Module Context

Bun 기반 API 프록시 서버. 프론트엔드의 `/api/generate`, `/api/config` 요청을 받아 Anthropic/Google API를 호출하고, 응답을 `react-live`에서 바로 실행 가능한 코드로 정규화해 반환한다.

## Tech Stack & Constraints

- 프레임워크 없이 `Bun.serve` 원시 API만 사용한다 (`server/index.ts:138-220`). Express 등 라우팅 프레임워크를 도입하지 마라.
- `server/*.ts`는 루트 `tsc -b` 빌드의 타입체크 대상이 아니다: `tsconfig.json`은 `tsconfig.app.json`(`include: ["src"]`)과 `tsconfig.node.json`(`include: ["vite.config.ts"]`)만 참조하며, 둘 다 `server/`를 포함하지 않는다. 즉 `bun run build`는 이 디렉토리를 타입체크하지 않는다 — 변경 후에는 `bun run server`로 런타임 확인하거나 에디터의 TS 진단에 의존하라.

## Implementation Patterns

- 부수효과 없는 로직은 `generator.ts`(`stripCodeFences`, `ensureRenderCall`), `fallback.ts`(`withModelFallback`)처럼 순수 함수로 분리하고, 동일 이름의 `*.test.ts`를 함께 작성한다.
- 새 AI provider를 추가할 때는 `callAnthropic`/`callGoogle` 같은 `callX` 함수 하나와 `ENV_KEYS`/`resolveApiKey` 패턴(`server/index.ts:59-66`)을 따른다.

## Testing Strategy

- `bun run test`(루트에서 실행, Vitest) 또는 `vitest run server`로 이 디렉토리만 실행 가능.
- 순수 함수(`generator.ts`, `fallback.ts`)만 테스트 대상이다. `index.ts`의 `Bun.serve` 핸들러 자체는 테스트가 없다 — 이 경계를 유지하라(루트 `AGENTS.md`의 Test Boundary 규칙 참조).

## Local Golden Rules

- **Asymmetry**: Google 경로(`callGoogle`, `server/index.ts:134-136`)는 `GOOGLE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash']`(`server/index.ts:5`) 목록을 통해 `withModelFallback`으로 순차 재시도하지만, Anthropic 경로(`callAnthropic`, `server/index.ts:68-96`)는 단일 모델만 호출하고 폴백이 없다. 두 provider 경로가 대칭이라고 가정하고 리팩터링하지 마라 — Anthropic에 폴백이 필요하면 별도로 설계해야 한다.
- **Double Defense**: `SYSTEM_PROMPT`는 "마크다운 펜스 없이 코드만" 그리고 "마지막에 `render(<ComponentName />)` 호출 포함"을 명시하지만(`server/index.ts:16`, `server/index.ts:12`), 응답은 여전히 `stripCodeFences`와 `ensureRenderCall`로 후처리된다(`server/index.ts:188`). 이는 LLM이 지시를 어길 수 있다는 전제로 만들어진 이중 방어다 — 프롬프트 지시가 있다는 이유로 이 후처리를 제거하지 마라.
- **Hard Constraint**: `react-live`는 `noInline` 모드로 렌더링된다(`src/components/LivePreview.tsx:14`). 이 때문에 `SYSTEM_PROMPT`는 "import 문 금지, React는 전역으로 이미 존재, TypeScript 문법 금지"를 명시한다(`server/index.ts:11`, `server/index.ts:20`). 이 제약을 완화하면 생성된 컴포넌트가 미리보기에서 렌더링되지 않는다 — 절대 완화하지 마라.
- **Security Boundary**: `resolveApiKey`(`server/index.ts:64-66`)는 클라이언트가 요청 본문으로 보낸 키(`clientKey`)를 서버 환경변수보다 우선 사용한다(`clientKey || ENV_KEYS[provider] || null`). 키 값 자체는 어떤 로그나 에러 메시지에도 남기지 마라 — 현재 catch 블록(`server/index.ts:191-212`)은 `err.message`만 반환하며 키를 포함하지 않는 관례를 유지한다.

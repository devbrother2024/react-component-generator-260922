# AGENTS.md

## Operational Commands

- Package manager: `bun` 고정. `bun.lock`이 유일한 락파일이다 — npm/yarn/pnpm 명령을 사용하지 마라.
- `bun install` — 의존성 설치.
- `bun run dev` — API 서버(포트 3002)와 Vite 프론트엔드를 동시 실행 (`concurrently`).
- `bun run server` — API 서버만 단독 실행 (`bun --watch run server/index.ts`).
- `bun run build` — `tsc -b && vite build`. 단, `server/` 디렉토리는 이 타입체크 대상에서 제외된다 (자세한 내용은 `server/AGENTS.md` 참조).
- `bun run lint` — ESLint.
- `bun run test` / `bun run test:watch` — Vitest (`vite.config.ts`의 `test.include`가 `src/**/*.test.{ts,tsx}`와 `server/**/*.test.ts`를 모두 포함).

## Golden Rules

### Immutable

- 서버가 보유한 실제 API 키 값(`ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`)을 클라이언트로 절대 전송하지 마라. `GET /api/config`는 키 존재 여부만 boolean으로 반환한다 (`server/index.ts:147-157`, `envKeys: { anthropic: !!ENV_KEYS.anthropic, google: !!ENV_KEYS.google }`). 이 핸들러를 수정해 키 원문이나 일부라도 응답에 포함시키지 마라.
- 에러 응답에 API 키 값을 포함하지 마라. 현재 에러 처리(`server/index.ts:191-212`)는 `err.message`만 클라이언트로 전달한다 — 새 에러 경로를 추가할 때도 키 값이 메시지에 섞이지 않도록 하라.

### Do's & Don'ts

- 포트 3002는 두 곳에 하드코딩되어 결합되어 있다: `Bun.serve({ port: 3002 })` (`server/index.ts:139`)와 Vite 프록시 대상 `http://localhost:3002` (`vite.config.ts:9-14`). 한쪽을 바꾸면 반드시 다른 쪽도 함께 바꿔라.
- 순수 로직과 부수효과 코드의 테스트 경계를 지켜라: `server/generator.ts`, `server/fallback.ts`(부수효과 없는 순수 함수)와 `src/components/PromptInput.tsx`에는 대응하는 `*.test.ts(x)`가 있지만, `server/index.ts`(`Bun.serve` 진입점), `src/App.tsx`, `src/hooks/useComponentGenerator.ts`, `src/components/LivePreview.tsx`, `src/components/ComponentCard.tsx`, `src/components/CodeView.tsx`에는 테스트가 없다. 새 로직을 추가할 때 가능하면 부수효과 없는 함수로 뽑아내고 테스트를 추가하라. 부수효과 코드에 억지로 단위 테스트를 강제하지 마라 — 이 프로젝트가 실제로 그렇게 하지 않는다.
- `tsconfig.app.json`과 `tsconfig.node.json`은 `verbatimModuleSyntax: true`, `erasableSyntaxOnly: true`를 강제한다 — 타입만 임포트할 때는 반드시 `import type`을 쓰고, enum처럼 런타임 표현이 남는 TS 전용 문법은 쓰지 마라.

## Project Context

프롬프트를 입력하면 AI(Anthropic Claude 또는 Google Gemini)가 React 컴포넌트를 생성하고, `react-live`로 즉시 미리보기와 코드를 제공하는 도구다.

Tech Stack: React 19, TypeScript, Vite, Bun (API 프록시 서버), react-live, Vitest, Testing Library, ESLint.

## Standards & References

- 프로젝트 소개, 설치, 실행 방법은 `README.md` 참조.
- 커밋 메시지, 브랜치 전략 등 Git 관례은 저장소의 기존 커밋 이력을 따른다.
- **Maintenance Policy**: 코드를 수정하면서 이 문서의 규칙과 실제 코드가 어긋난다는 것을 발견하면, 계속 진행하기 전에 이 파일 업데이트를 제안하라.

## Context Map

- **[API 프록시 서버 (Bun)](./server/AGENTS.md)** — `server/` 아래 파일을 수정할 때, 특히 API 키 처리·provider별 폴백·생성 코드 정규화 로직.

# CLAUDE.md

## 개발 명령어

```bash
npm run dev       # 개발 서버 (Turbopack)
npm run build     # 프로덕션 빌드
npm run lint      # ESLint
npm test          # Jest 테스트
npm run test:watch
```

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router), React 19, TypeScript 5 |
| 스타일 | Tailwind CSS v4, SCSS, shadcn/ui (new-york 스타일) |
| 상태 관리 | Zustand (auth), React Context (settings/themes) |
| 에디터 | Tiptap v2 |
| 폼 | React Hook Form + Yup |
| DB/스토리지 | Firebase Firestore + Firebase Storage |
| 인증 | Google OAuth + Firebase Auth (서버: Firebase Admin SDK) |
| 테스트 | Jest 30 + Testing Library |
| 아이콘 | Lucide React |
| 알림 | Sonner |
| 애니메이션 | Framer Motion |

---

## 디렉토리 구조

```
src/
├── app/
│   ├── api/              # API 라우트 (Next.js Route Handlers)
│   │   ├── _lib/         # 서버 전용 공유 로직 (auth, DB, response 등)
│   │   ├── auth/         # Google OAuth
│   │   ├── admin/        # 관리자 전용 API
│   │   ├── library/      # 블로그/문서 CRUD + 댓글
│   │   ├── memo/         # 메모 CRUD
│   │   ├── guestbook/    # 방명록
│   │   ├── gallery/      # 갤러리
│   │   ├── photoboard/   # 사진 게시판
│   │   ├── settings/     # 설정 API
│   │   ├── ai/           # AI 이미지 생성 (Gemini)
│   │   ├── weather/      # 날씨
│   │   └── images/       # 이미지 업로드
│   ├── setting/          # 설정 페이지들
│   ├── library/          # 라이브러리 페이지
│   ├── gallery/
│   ├── guestbook/
│   ├── memo/
│   ├── photoboard/
│   ├── styles/           # 페이지 CSS (base, theme, layout 등)
│   └── globals.css
├── components/
│   ├── ui/               # shadcn/ui 컴포넌트 27개
│   ├── layout/           # Layout.tsx, SettingLayout.tsx
│   ├── modal/            # 모달 컴포넌트
│   ├── tiptap/           # Tiptap 에디터
│   ├── tiptap-extension/ # Tiptap 커스텀 익스텐션
│   ├── tiptap-ui/        # Tiptap 툴바 UI
│   ├── widgets/          # 메인 페이지 위젯
│   └── setting/          # 설정 UI 컴포넌트
├── features/             # 기능별 모듈 (아래 패턴 참고)
├── hooks/                # 전역 커스텀 훅
├── contexts/             # React Context (5개)
├── providers/            # Providers.tsx, SettingsProvider, ThemeProvider
├── store/auth/           # Zustand auth store
├── shared/lib/           # 공유 유틸리티 + 테스트
├── styles/               # 전역 SCSS (_variables, _keyframes)
└── data/                 # 정적 데이터
```

---

## 아키텍처 패턴

### Feature 모듈 구조

각 기능은 `src/features/[feature]/` 아래 구성:

```
features/[feature]/
├── api/
│   └── client.ts         # 클라이언트에서 API 호출하는 함수들
├── hooks/
│   └── use[Feature].ts   # 해당 기능의 커스텀 훅
├── components/           # 기능 전용 컴포넌트
└── types/                # 타입 정의 (필요 시)
```

현재 features: `account`, `admin`, `comment`, `gallery`, `guestbook`, `library`, `memo`, `photoboard`, `settings`, `stickerboard-editor`

### API Route 패턴

```typescript
// src/app/api/[feature]/route.ts
import { requireAdmin } from "@/app/api/_lib/auth"; // 또는 requireAuth
import { getDb } from "@/app/api/_lib/admin";
import { ok, err } from "@/app/api/_lib/response";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (!authResult.success) return err(authResult.error, 401);

  const db = getDb();
  // ... 로직
  return ok(data);
}
```

- `requireAdmin(req)` - 관리자만 허용
- `requireAuth(req)` - 로그인 사용자 허용
- `ok(data)` → `{ success: true, data }`
- `err("message", 400)` → `{ success: false, error: "message" }`

### 클라이언트 API 클라이언트 패턴

```typescript
// src/features/[feature]/api/client.ts
export async function fetchXxx(): Promise<XxxData> {
  const res = await fetch("/api/[feature]/...");
  if (!res.ok) throw new Error("...");
  return res.json();
}
```

### 커스텀 훅 패턴

```typescript
export function use[Feature]() {
  const [data, setData] = useState<Type | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // fetch
  }, []);

  return { data, loading };
}
```

---

## 공통 유틸리티

### Path Alias
`@/*` → `src/*`

### cn() - 클래스 병합
```typescript
import { cn } from "@/lib/utils";
<div className={cn("base-class", condition && "conditional-class")} />
```

### 날짜
```typescript
import { formatDate } from "@/shared/lib/date";
```

### 이미지 업로드
- `POST /api/images/uploadImage` - 일반 이미지
- `POST /api/gallery/uploadImage` - 갤러리 이미지
- Firebase Storage에 저장 후 public URL 반환

---

## shadcn/ui 컴포넌트 목록

`src/components/ui/`에 있는 컴포넌트:

`badge` `button` `button-group` `card` `checkbox` `color-palette-preview` `color-picker` `date-picker` `dialog` `dropdown-menu` `input` `label` `pagination` `popover` `radio-group` `scroll-area` `select` `separator` `sheet` `skeleton` `slider` `sonner` `switch` `table` `tabs` `textarea` `tooltip`

새 shadcn 컴포넌트 추가: `npx shadcn@latest add [component]`

---

## 환경 변수 (.env.local)

서버 전용 (API Route에서만 사용):

```
FIREBASE_SERVICE_ACCOUNT_KEY=   # Firebase Admin SDK JSON (단일 행)
FIREBASE_STORAGE_BUCKET=        # Firebase Storage 버킷명
FIREBASE_OWNER_UID=             # 관리자 UID
GOOGLE_CLIENT_ID=               # Google OAuth
GOOGLE_CLIENT_SECRET=
GOOGLE_WEB_API_KEY=             # Firebase Web API Key
```

---

## 코딩 컨벤션

- **컴포넌트 파일명**: PascalCase (`MyComponent.tsx`)
- **훅/유틸 파일명**: camelCase (`useMyHook.ts`, `myUtil.ts`)
- **import 순서**: 외부 라이브러리 → `@/` 내부 모듈
- **서버/클라이언트 경계**: Firebase Admin SDK(`getDb`, `getBucket`, `getFireAuth`)는 API Route 또는 Server Component에서만 사용. 클라이언트에서 절대 import 금지.
- **React 소유 DOM 불변 원칙**: React(또는 Next.js metadata)가 렌더링한 노드를 `querySelector`로 찾아 `remove()`/`appendChild()` 하지 않는다. 위반 시 라우트 이동에서 `removeChild` null 크래시가 발생한다. `<head>` 태그(favicon·title·link·style)는 metadata API 또는 JSX(`<link>`/`<style precedence>` — React 19가 head로 호이스팅)로만 관리하고, 전역 시각 효과는 `:root`의 CSS 변수·데이터 속성으로 제어한다.
- `"use client"` 디렉티브는 클라이언트 컴포넌트 최상단에 명시

---

## 테스트

테스트 파일 위치: `src/shared/lib/__tests__/`

```bash
npm test
npx jest --no-coverage [pattern]   # 특정 파일만
```

모킹: `src/__mocks__/server-only.js`

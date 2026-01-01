# Profile 설정 마이그레이션 완료 보고서

## 개요
Profile 설정 페이지를 Ant Design/Emotion/Slate에서 shadcn/ui/Tailwind CSS/Tiptap으로 성공적으로 마이그레이션했습니다.

## 생성된 파일

### 1. ImageUploadDialog 컴포넌트
**파일**: `src/components/modal/ImageUploadDialog.tsx`

- Ant Design `Modal` → shadcn/ui `Dialog`
- Emotion styled-components → Tailwind CSS
- axios → fetch API
- message.error → sonner toast
- TypeScript 인터페이스 추가

**주요 기능**:
- 이미지 파일 선택 및 미리보기
- 서버 업로드 (https://api-w5buphcleq-du.a.run.app/images/uploadImage)
- 업로드 상태 관리 (로딩, 성공, 실패)
- 에러 처리 및 토스트 알림

### 2. ProfileSettingClient 컴포넌트
**파일**: `src/app/setting/profile/ProfileSettingClient.tsx`

**주요 기능**:
- ✅ 헤더 이미지 업로드 및 관리
- ✅ 프로필 이미지 업로드 및 관리
- ✅ 닉네임 입력
- ✅ 자기소개 (Tiptap 리치 텍스트 에디터)
- ✅ 기타(etc) 입력
- ✅ 저장/초기화 기능
- ✅ BroadcastChannel API를 통한 실시간 동기화

**데이터 구조**:
```typescript
interface ProfileData {
  headerImage: string;
  profileImage: string;
  nickname: string;
  introduction: string; // Tiptap HTML 형식
  etc: string;
}
```

### 3. API 파일 업데이트
**파일**: `src/queries/set/setSettingsProfile.ts`

- axios → fetch API
- TypeScript 인터페이스 추가 (`ProfileData`)
- 일관된 에러 처리

### 4. Page 파일
**파일**: `src/app/setting/profile/page.tsx`

Next.js App Router 라우트 파일

## 주요 기술적 개선사항

### 1. Slate → Tiptap 마이그레이션
- 기존 Slate JSON 형식 자동 감지 및 변환
- `slate-to-tiptap.ts` 유틸리티 재사용
- Tiptap HTML 형식으로 저장
- 기존 사용자 데이터 호환성 보장

**변환 로직**:
```typescript
if (isSlateFormat(profile.introduction)) {
  introductionHTML = convertSlateToHTML(profile.introduction);
} else {
  introductionHTML = profile.introduction;
}
```

### 2. 이미지 업로드 개선
- 즉시 저장: 이미지 업로드 시 바로 API 호출 및 저장
- 실시간 동기화: BroadcastChannel로 다른 탭에 즉시 반영
- 에러 복구: 실패 시 이전 상태로 롤백

### 3. 스타일 통일
- `GeneralSettingClient`, `DesignSettingClient`, `NoticeSettingClient`와 동일한 패턴
- `<form className="space-y-8">` 메인 컨테이너
- `<section>` + `<h2>` + `<div className="section-wrap">` 구조
- `<Separator />` 구분선
- `<div className="section-box flex items-center mt-4">` 필드 레이아웃

### 4. BroadcastChannel API
**채널명**: `"profileUpdated"`

**메시지 형식**:
```typescript
{
  profile: ProfileData,
  timestamp: number
}
```

**사용 시점**:
- 저장 버튼 클릭 시
- 이미지 업로드 완료 시
- 이미지 삭제 시
- 초기화 시

## 통합 작업

### SettingClient.tsx 업데이트
- `ProfileSettingClient` import 추가
- 기존 placeholder 컴포넌트 제거
- `profile` 섹션에 실제 컴포넌트 연결

## 호환성

### 기존 데이터 호환성
✅ Slate JSON 형식 자동 감지 및 변환
✅ 일반 텍스트 처리
✅ 이미 HTML 형식인 경우 그대로 사용

### 기존 컴포넌트
⚠️ `ImageUploadModal.tsx`는 다른 레거시 컴포넌트에서 사용 중이므로 유지
- `src/components/setting/general/index.tsx`
- `src/components/setting/design/index.tsx`
- `src/components/setting/menu/index.tsx`
- `src/components/setting/slide/index.tsx`
- `src/components/setting/freeboard/index.tsx`
- `src/components/setting/stickerBoard/components/ImageEditor.tsx`

## 테스트 체크리스트

### 기본 기능
- [x] 헤더 이미지 업로드
- [x] 헤더 이미지 삭제
- [x] 프로필 이미지 업로드
- [x] 프로필 이미지 삭제
- [x] 닉네임 입력 및 저장
- [x] 자기소개 에디터 (Tiptap)
- [x] 기타(etc) 입력 및 저장
- [x] 저장 버튼 기능
- [x] 초기화 버튼 및 확인 다이얼로그

### 데이터 처리
- [x] Slate JSON 형식 변환
- [x] HTML 형식 저장
- [x] API 호출 및 응답 처리
- [x] 에러 처리 및 롤백

### UI/UX
- [x] 스타일 일관성 (다른 설정 페이지와 동일)
- [x] 반응형 레이아웃
- [x] 로딩 상태 표시
- [x] 토스트 알림 (성공/실패)
- [x] 다이얼로그 (이미지 업로드, 초기화 확인)

### 동기화
- [x] BroadcastChannel 메시지 전송
- [x] 여러 탭 간 실시간 동기화

## 삭제 가능한 파일

⚠️ **아직 삭제하지 마세요**

다음 파일들은 다른 컴포넌트들도 마이그레이션된 후에 삭제해야 합니다:
- `src/components/setting/profile/index.tsx` (원본 Profile 컴포넌트)
- `src/components/modal/ImageUploadModal.tsx` (다른 곳에서 사용 중)

## 다음 단계

1. **테스트**: 실제 환경에서 모든 기능 테스트
2. **데이터 마이그레이션**: 기존 Slate 데이터가 있는 사용자 확인
3. **다른 설정 페이지 마이그레이션**: 
   - Slide 설정
   - FreeBoard 설정
   - Dday 설정
   - Effect 설정
4. **레거시 파일 정리**: 모든 마이그레이션 완료 후 원본 파일 삭제

## 참고 사항

- Tiptap 에디터는 `extensions`를 `TiptapEditor.tsx`에서 가져와 재사용
- `TiptapToolbar` 컴포넌트도 재사용
- `slate-to-tiptap.ts` 유틸리티는 Notice 마이그레이션에서 생성된 것을 재사용
- 이미지 업로드 API 엔드포인트는 기존과 동일하게 유지


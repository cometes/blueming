# 관리자 스티커보드 편집기(레거시 → blueming) 기능 매핑

이 문서는 **레거시(gray-and-blue)**에서 구현된 스티커보드(FreeBoard) 편집기의 주요 기능을 **blueming**으로 옮길 때의 매핑을 정리합니다.  
현재 단계(Phase 0)에서는 편집 페이지를 구현하지 않으며, 다음 단계에서 참고하기 위한 설계 문서입니다.

## 목표

- 캡처 이미지 1장 저장이 아니라, **스티커를 개별 객체(`components`)로 저장**한다.
- 편집/저장은 **관리자만 가능**하다.
- 설정 저장은 기존과 동일하게 `settings/main.stickerBoard`에 merge 저장한다.

## 저장 구조(권장)

- **Settings 문서**
  - 경로: `settings/main`
  - 필드: `stickerBoard`
  - 값: `{ title, description, enabled, ... , components: StickerBoardComponent[] }`
  - 백엔드: `POST /settings/main/stickerBoard` (`requireAdmin`)

- **캡처(capture)**
  - 레거시에서는 썸네일/미리보기 목적이었음.
  - 신규에서는 **필수 아님**. 필요할 때만 선택적으로 유지 가능.

## 레거시 구성요소(주요 파일)

- `FreeBoardContext.tsx`
  - 캔버스 비율(`ratio`) 계산 및 Slate 기반 텍스트 콘텐츠(`content`) 보관
  - 텍스트가 이미지 위/아래인지(`isTextTop`) 상태 보관

- `ComponentContext.tsx`
  - 스티커(이미지) 컴포넌트 배열 관리: 추가/수정/삭제/복제
  - 저장: `html2canvas`로 캡처 → 업로드 → `settings/main/stickerBoard` 저장
  - undo/redo용 History 연동

- `LayerContext.tsx`
  - 레이어 reorder, lock, visibility 등 레이어 패널 기능

- `ImageEditor.tsx`
  - 실제 캔버스 UI + `react-rnd` 기반 드래그/리사이즈 + 회전 핸들
  - 키보드 단축키(복사/붙여넣기/삭제, 전체선택 등)

## blueming으로의 매핑(제안)

### 1) 캔버스 및 좌표계

- 레거시/현 프로젝트 모두 **12×12 기준 비율**로 캔버스 비율을 계산하는 로직이 있음.
- 편집기/미리보기/저장 좌표계는 **동일 기준**을 사용해야 함(데이터 흔들림 방지).

### 2) 스티커 모델

레거시는 이미지 스티커 중심이었지만, blueming에서는 텍스트 스티커도 필요할 수 있어 **유니온 타입**을 권장:

- `type: "image"` + `imageUrl`
- `type: "text"` + `text`(plain) + `style`(배경/글자/폰트/정렬 등)

### 3) 편집 기능(다음 단계에서 구현)

- **선택/다중선택**
  - 클릭: 단일 선택
  - Shift: 범위 선택
  - Ctrl/Cmd: 토글 선택

- **드래그/리사이즈**
  - `react-rnd` 또는 동등 라이브러리 사용
  - lock 상태면 이동/리사이즈 불가

- **회전**
  - 레거시처럼 별도 회전 핸들 + 각도 가이드라인

- **레이어**
  - `zIndex` 기반 정렬
  - 레이어 패널에서 reorder
  - `isVisible`, `isLocked` 토글

- **정렬**
  - 좌/중/우, 상/중/하 정렬

- **저장**
  - `components` 배열을 그대로 `POST /settings/main/stickerBoard`로 저장
  - (선택) 썸네일이 필요하면 캡처를 별도 필드로 추가 저장

## UI 레이아웃(레거시 참고 지점)

- 레거시는 “캔버스(중앙) + 레이어 패널(우측) + 툴바(우측 하단)” 구조.
- blueming에서는 동일 정보 구조를 유지하되, Tailwind 기반으로 **간격/타이포/카드 톤**을 더 정돈하는 방향을 권장.


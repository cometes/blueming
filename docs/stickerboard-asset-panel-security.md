# 스티커보드 에셋 패널 보안 규칙 체크리스트

## 전제
- 에셋(이미지) 라이브러리는 **사용자별(per-user)** 로 관리합니다.
- Firestore 컬렉션: `users/{uid}/stickerAssets/{assetId}`
- Storage 경로: `users/{uid}/stickerAssets/{assetId}.{ext}`

## Firestore Rules (예시)
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/stickerAssets/{assetId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Storage Rules (예시)
```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{uid}/stickerAssets/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 구현 체크리스트
- [ ] 비로그인 상태에서 에셋 목록/업로드/삭제 시도 시, 클라이언트에서 적절히 에러 처리된다(토스트/메시지).
- [ ] Firestore 문서에 `storagePath`가 저장되어 삭제 시 Storage 객체도 함께 삭제된다.
- [ ] 즐겨찾기/최근사용 업데이트는 해당 사용자 문서만 수정 가능하다.
- [ ] 업로드 파일 타입/크기 제한은 클라이언트에서 1차 방어(필요 시 서버/Rules에서도 강화).


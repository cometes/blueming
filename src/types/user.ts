// 회원 상태
export type UserStatus = "active" | "suspended" | "pending";

// 회원 권한
export type UserRole = "user" | "manager" | "admin";

// 회원 정보 인터페이스
export interface User {
    uid: string; // Firebase UID
    email: string; // 이메일
    displayName: string | null; // 표시 이름
    photoURL: string | null; // 프로필 이미지 URL

    // 회원 관리 필드
    status: UserStatus; // 회원 상태
    role: UserRole; // 권한

    // 가입 정보
    createdAt: string | null; // 가입일
    lastLoginAt: string | null; // 최근 로그인

    // 활동 통계 (선택적)
    postCount?: number; // 작성 게시글 수
    commentCount?: number; // 작성 댓글 수

    // 추가 정보
    suspendedReason?: string; // 정지 사유
    approvedAt?: string | null; // 승인일
    approvedBy?: string; // 승인자 UID
}

// 가입 모드
export type RegistrationMode = "open" | "approval" | "closed";

// 회원관리 설정 인터페이스
export interface UserManagementSettings {
    registrationMode: RegistrationMode; // 가입 모드
    whitelist: string[]; // 이메일 화이트리스트
    blacklist: string[]; // 이메일 블랙리스트
    autoApprove: boolean; // 화이트리스트 자동 승인
    notifyOnNewUser: boolean; // 신규 가입 알림
    updatedAt: string | null; // 마지막 수정일
    updatedBy: string; // 수정자 UID
}

// 회원 목록 조회 응답
export interface UsersListResponse {
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// 회원 목록 조회 파라미터
export interface UsersListParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: UserStatus;
    role?: UserRole;
    sortBy?: "createdAt" | "lastLoginAt" | "displayName";
    sortOrder?: "asc" | "desc";
}

// 회원 상태 변경 요청
export interface UpdateUserStatusRequest {
    status: UserStatus;
    reason?: string;
}

// 회원 권한 변경 요청
export interface UpdateUserRoleRequest {
    role: UserRole;
}

// 회원 승인/거부 요청
export interface ApproveUserRequest {
    approved: boolean;
    reason?: string;
}

// 회원 통계
export interface UserStats {
    totalUsers: number; // 전체 회원 수
    activeUsers: number; // 활성 회원 수
    suspendedUsers: number; // 정지 회원 수
    pendingUsers: number; // 승인 대기 수
    managerCount?: number; // 매니저 수
    adminCount?: number; // 관리자 수
    newUsersToday?: number; // 오늘 신규 가입
    newUsersWeek?: number; // 7일 신규 가입
    newUsersMonth?: number; // 30일 신규 가입
    activeUsersWeek?: number; // 최근 7일 활동 회원
    activeUsersMonth?: number; // 최근 30일 활동 회원
}

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/Firebase";
import type {
    User,
    UsersListParams,
    UsersListResponse,
} from "@/types/user";

// 관리자 권한 확인 헬퍼 함수
async function checkAdminPermission(req: NextRequest) {
    // TODO: Firebase ID 토큰 검증 및 권한 확인
    // 현재는 임시로 true 반환
    return true;
}

// 회원 목록 조회 API
export async function GET(req: NextRequest) {
    try {
        // 권한 확인
        const hasPermission = await checkAdminPermission(req);
        if (!hasPermission) {
            return NextResponse.json(
                { error: "권한이 없습니다." },
                { status: 403 }
            );
        }

        // 쿼리 파라미터 파싱
        const searchParams = req.nextUrl.searchParams;
        const params: UsersListParams = {
            page: parseInt(searchParams.get("page") || "1"),
            limit: parseInt(searchParams.get("limit") || "25"),
            search: searchParams.get("search") || undefined,
            status: (searchParams.get("status") as UsersListParams["status"]) || undefined,
            role: (searchParams.get("role") as UsersListParams["role"]) || undefined,
            sortBy: (searchParams.get("sortBy") as UsersListParams["sortBy"]) || "createdAt",
            sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
        };

        // Firestore 쿼리 생성
        let query = adminDb.collection("users");

        // 상태 필터
        if (params.status) {
            query = query.where("status", "==", params.status) as any;
        }

        // 권한 필터
        if (params.role) {
            query = query.where("role", "==", params.role) as any;
        }

        // 정렬
        const sortField = params.sortBy || "createdAt";
        const sortDirection = params.sortOrder || "desc";
        query = query.orderBy(sortField, sortDirection) as any;

        // 페이지네이션
        const page = params.page || 1;
        const limit = params.limit || 25;
        const offset = (page - 1) * limit;

        // 쿼리 실행
        const snapshot = await query.get();
        let users = snapshot.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
        })) as User[];

        // 검색 필터 (클라이언트 측)
        if (params.search) {
            const searchLower = params.search.toLowerCase();
            users = users.filter(
                (user) =>
                    user.displayName?.toLowerCase().includes(searchLower) ||
                    user.email.toLowerCase().includes(searchLower)
            );
        }

        const total = users.length;
        const paginatedUsers = users.slice(offset, offset + limit);

        const response: UsersListResponse = {
            users: paginatedUsers,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "회원 목록을 불러오는데 실패했습니다." },
            { status: 500 }
        );
    }
}

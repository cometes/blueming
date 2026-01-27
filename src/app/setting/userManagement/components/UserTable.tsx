"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { User, UserStatus, UserRole } from "@/types/user";
import UserTableRow from "./UserTableRow";
import UserDetailModal from "./UserDetailModal";
import { fetchAdminUsers } from "@/queries/userManagement";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { List } from "lucide-react";

interface UserTableProps {
    searchQuery: string;
    statusFilter: UserStatus | "all";
    roleFilter: UserRole | "all";
    currentPage: number;
    pageSize: number;
    sortBy: "createdAt" | "lastLoginAt" | "displayName";
    sortOrder: "asc" | "desc";
    onSortChange: (sortBy: "createdAt" | "lastLoginAt" | "displayName", sortOrder: "asc" | "desc") => void;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

export default function UserTable({
    searchQuery,
    statusFilter,
    roleFilter,
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    onSortChange,
    onPageChange,
    onPageSizeChange,
}: UserTableProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const listRef = useRef<HTMLDivElement | null>(null);
    const shouldScrollRef = useRef(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsLoading(true);
                const data = await fetchAdminUsers({
                    page: currentPage,
                    limit: pageSize,
                    search: searchQuery || undefined,
                    status: statusFilter === "all" ? undefined : statusFilter,
                    role: roleFilter === "all" ? undefined : roleFilter,
                    sortBy,
                    sortOrder,
                });
                setUsers(data.users);
                setTotal(data.total);
                setTotalPages(data.totalPages);
            } catch (error) {
                console.error("회원 목록 조회 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, [currentPage, pageSize, roleFilter, searchQuery, sortBy, sortOrder, statusFilter]);

    useEffect(() => {
        if (searchQuery || statusFilter !== "all" || roleFilter !== "all") {
            shouldScrollRef.current = true;
        }
    }, [searchQuery, statusFilter, roleFilter]);

    useEffect(() => {
        if (!isLoading && shouldScrollRef.current) {
            listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            shouldScrollRef.current = false;
        }
    }, [isLoading, users]);

    const handleUserClick = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleUserUpdate = () => {
        setIsModalOpen(false);
        setIsLoading(true);
        fetchAdminUsers({
            page: currentPage,
            limit: pageSize,
            search: searchQuery || undefined,
            status: statusFilter === "all" ? undefined : statusFilter,
            role: roleFilter === "all" ? undefined : roleFilter,
            sortBy,
            sortOrder,
        })
            .then((data) => {
                setUsers(data.users);
                setTotal(data.total);
                setTotalPages(data.totalPages);
            })
            .finally(() => setIsLoading(false));
    };

    const sortIndicator = useMemo(
        () => (sortOrder === "asc" ? "▲" : "▼"),
        [sortOrder]
    );

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-sub-text">로딩 중...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card ref={listRef} className="overflow-hidden min-h-[340px] flex flex-col">
                <CardHeader className="flex-row items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">
                        <List className="h-5 w-5 text-sub-text" />
                        회원 목록 ({total}명)
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-sub-text">
                        <span>정렬:</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() =>
                                onSortChange(
                                    "createdAt",
                                    sortBy === "createdAt" && sortOrder === "desc" ? "asc" : "desc"
                                )
                            }
                        >
                            가입일 {sortBy === "createdAt" ? sortIndicator : ""}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() =>
                                onSortChange(
                                    "lastLoginAt",
                                    sortBy === "lastLoginAt" && sortOrder === "desc"
                                        ? "asc"
                                        : "desc"
                                )
                            }
                        >
                            최근 로그인 {sortBy === "lastLoginAt" ? sortIndicator : ""}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() =>
                                onSortChange(
                                    "displayName",
                                    sortBy === "displayName" && sortOrder === "desc"
                                        ? "asc"
                                        : "desc"
                                )
                            }
                        >
                            이름 {sortBy === "displayName" ? sortIndicator : ""}
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-4 min-w-0 flex-1">
                    <div className="space-y-3">
                        {users.length === 0 ? (
                            <div className="min-h-[260px] flex items-center justify-center text-sub-text">
                                회원이 없습니다.
                            </div>
                        ) : (
                            users.map((user) => (
                                <UserTableRow
                                    key={user.uid}
                                    user={user}
                                    onClick={() => handleUserClick(user)}
                                />
                            ))
                        )}
                    </div>
                </CardContent>

                {total > 0 && (
                    <div className="mt-auto px-6 py-4 border-t border-card-bg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-sub-text">페이지당</span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={(value) => {
                                    onPageSizeChange(Number(value));
                                    onPageChange(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[110px] rounded-card border-card bg-card text-main-text text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10개</SelectItem>
                                    <SelectItem value="25">25개</SelectItem>
                                    <SelectItem value="50">50개</SelectItem>
                                    <SelectItem value="100">100개</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                이전
                            </Button>
                            <span className="text-sm text-sub-text">
                                {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                다음
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* 회원 상세 모달 */}
            {selectedUser && (
                <UserDetailModal
                    user={selectedUser}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onUpdate={handleUserUpdate}
                />
            )}
        </>
    );
}

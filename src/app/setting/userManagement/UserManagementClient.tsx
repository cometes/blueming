"use client";

import { useState } from "react";
import UserStatsDashboard from "./components/UserStatsDashboard";
import RegistrationSettings from "./components/RegistrationSettings";
import UserSearchFilter from "./components/UserSearchFilter";
import UserTable from "./components/UserTable";
import type { UserStatus, UserRole } from "@/types/user";

export default function UserManagementClient() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
    const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [sortBy, setSortBy] = useState<"createdAt" | "lastLoginAt" | "displayName">("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    return (
        <div className="space-y-6">
            {/* 통계 대시보드 */}
            <UserStatsDashboard />

            {/* 가입 설정 */}
            <RegistrationSettings />

            {/* 검색 및 필터 */}
            <UserSearchFilter
                searchQuery={searchQuery}
                onSearchChange={(value) => {
                    setSearchQuery(value);
                    setCurrentPage(1);
                }}
                statusFilter={statusFilter}
                onStatusFilterChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                }}
                roleFilter={roleFilter}
                onRoleFilterChange={(value) => {
                    setRoleFilter(value);
                    setCurrentPage(1);
                }}
            />

            {/* 회원 목록 테이블 */}
            <UserTable
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                roleFilter={roleFilter}
                currentPage={currentPage}
                pageSize={pageSize}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={(nextSortBy, nextSortOrder) => {
                    setSortBy(nextSortBy);
                    setSortOrder(nextSortOrder);
                    setCurrentPage(1);
                }}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
            />
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import type { UserStatus, UserRole } from "@/types/user";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserSearchFilterProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    statusFilter: UserStatus | "all";
    onStatusFilterChange: (status: UserStatus | "all") => void;
    roleFilter: UserRole | "all";
    onRoleFilterChange: (role: UserRole | "all") => void;
}

export default function UserSearchFilter({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    roleFilter,
    onRoleFilterChange,
}: UserSearchFilterProps) {
    const [localQuery, setLocalQuery] = useState(searchQuery);

    useEffect(() => {
        setLocalQuery(searchQuery);
    }, [searchQuery]);

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                        <Label className="text-sm font-medium text-main-text flex items-center gap-2">
                            <Search className="h-4 w-4 text-sub-text" />
                            검색
                        </Label>
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="이름 또는 이메일로 검색..."
                                value={localQuery}
                                onChange={(e) => setLocalQuery(e.target.value)}
                                className="pr-12"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        onSearchChange(localQuery.trim());
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                onClick={() => onSearchChange(localQuery.trim())}
                                aria-label="검색"
                            >
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2 min-w-[150px]">
                        <Label className="text-sm font-medium text-main-text">
                            상태
                        </Label>
                        <Select
                            value={statusFilter}
                            onValueChange={(value) =>
                                onStatusFilterChange(value as UserStatus | "all")
                            }
                        >
                            <SelectTrigger className="rounded-card border-card bg-card text-main-text">
                                <SelectValue placeholder="전체" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">전체</SelectItem>
                                <SelectItem value="active">활성</SelectItem>
                                <SelectItem value="suspended">정지</SelectItem>
                                <SelectItem value="pending">대기</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 min-w-[150px]">
                        <Label className="text-sm font-medium text-main-text">
                            권한
                        </Label>
                        <Select
                            value={roleFilter}
                            onValueChange={(value) =>
                                onRoleFilterChange(value as UserRole | "all")
                            }
                        >
                            <SelectTrigger className="rounded-card border-card bg-card text-main-text">
                                <SelectValue placeholder="전체" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">전체</SelectItem>
                                <SelectItem value="user">일반 회원</SelectItem>
                                <SelectItem value="manager">매니저</SelectItem>
                                <SelectItem value="admin">관리자</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

"use client";

import type { User } from "@/features/admin/types";
import Avatar from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";

interface UserTableRowProps {
    user: User;
    onClick: () => void;
}

export default function UserTableRow({ user, onClick }: UserTableRowProps) {
    return (
        <div
            onClick={onClick}
            role="button"
            tabIndex={0}
            aria-label={`${user.displayName || "이름 없음"} 상세보기`}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick();
                }
            }}
            className="flex items-center justify-between gap-4 rounded-card border border-card bg-card px-4 py-3 hover:bg-card-bg transition-colors cursor-pointer"
        >
            <div className="flex items-center gap-3 min-w-0">
                <Avatar
                    src={user.photoURL}
                    name={user.displayName}
                    alt={user.displayName || "User"}
                    className="h-10 w-10"
                />
                <div className="min-w-0">
                    <div className="text-sm font-medium text-main-text truncate">
                        {user.displayName || "이름 없음"}
                    </div>
                    <div className="text-xs text-sub-text truncate">
                        {user.email}
                    </div>
                </div>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
            >
                상세보기
            </Button>
        </div>
    );
}

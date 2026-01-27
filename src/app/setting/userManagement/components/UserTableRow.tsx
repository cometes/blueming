"use client";

import type { User } from "@/types/user";
import { Button } from "@/components/ui/button";

interface UserTableRowProps {
    user: User;
    onClick: () => void;
}

export default function UserTableRow({ user, onClick }: UserTableRowProps) {
    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between gap-4 rounded-card border border-card bg-card px-4 py-3 hover:bg-card-bg transition-colors cursor-pointer"
        >
            <div className="flex items-center gap-3 min-w-0">
                <img
                    src={user.photoURL || "/default-avatar.png"}
                    alt={user.displayName || "User"}
                    className="w-10 h-10 rounded-full"
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

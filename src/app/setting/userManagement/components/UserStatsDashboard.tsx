"use client";

import { useEffect, useState } from "react";
import type { UserStats } from "@/types/user";
import { fetchUserStats } from "@/queries/userManagement";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function UserStatsDashboard() {
    const [stats, setStats] = useState<UserStats>({
        totalUsers: 0,
        activeUsers: 0,
        suspendedUsers: 0,
        pendingUsers: 0,
        managerCount: 0,
        adminCount: 0,
        newUsersToday: 0,
        newUsersWeek: 0,
        newUsersMonth: 0,
        activeUsersWeek: 0,
        activeUsersMonth: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                setIsLoading(true);
                const data = await fetchUserStats();
                setStats((prev) => ({ ...prev, ...data }));
            } catch (error) {
                console.error("통계 조회 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadStats();
    }, []);

    const StatCard = ({
        title,
        value,
        icon,
        color,
    }: {
        title: string;
        value: number;
        icon: React.ReactNode;
        color: string;
    }) => (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-sub-text">{title}</p>
                        <p className={`text-2xl font-semibold mt-2 ${color}`}>
                            {isLoading ? "..." : value.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-2xl text-main-text">{icon}</div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
                title="전체 회원"
                value={stats.totalUsers}
                icon={<Users className="h-6 w-6" />}
                color="text-theme-primary"
            />
            <StatCard
                title="활성 회원"
                value={stats.activeUsers}
                icon={<UserCheck className="h-6 w-6" />}
                color="text-emerald-500"
            />
            <StatCard
                title="정지 회원"
                value={stats.suspendedUsers}
                icon={<UserX className="h-6 w-6" />}
                color="text-rose-500"
            />
            <StatCard
                title="승인 대기"
                value={stats.pendingUsers}
                icon={<Clock className="h-6 w-6" />}
                color="text-amber-500"
            />
        </div>
    );
}

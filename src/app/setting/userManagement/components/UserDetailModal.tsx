"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/auth/store";
import type { User, UserStatus, UserRole } from "@/types/user";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    approveUser,
    deleteUser,
    updateUserRole,
    updateUserStatus,
} from "@/queries/userManagement";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface UserDetailModalProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export default function UserDetailModal({
    user,
    isOpen,
    onClose,
    onUpdate,
}: UserDetailModalProps) {
    const { user: currentUser } = useAuthStore();
    const [status, setStatus] = useState<UserStatus>(user.status);
    const [role, setRole] = useState<UserRole>(user.role || "user");
    const [suspendedReason, setSuspendedReason] = useState(
        user.suspendedReason || ""
    );
    const [approvalReason, setApprovalReason] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const isAdmin = currentUser?.role === "admin";
    const isManager = currentUser?.role === "manager" || isAdmin;
    const canManageTarget = useMemo(() => {
        if (user.role === "admin" && !isAdmin) return false;
        return isManager;
    }, [user.role, isAdmin, isManager]);

    useEffect(() => {
        setStatus(user.status);
        setRole(user.role || "user");
        setSuspendedReason(user.suspendedReason || "");
    }, [user]);

    const toDate = (value: User["createdAt"]) => {
        if (!value) return null;
        if (typeof value === "string") return new Date(value);
        if (typeof (value as any).toDate === "function") return (value as any).toDate();
        return null;
    };

    const formatDate = (value: User["createdAt"]) => {
        const date = toDate(value);
        return date ? format(date, "yyyy-MM-dd HH:mm") : "-";
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            let didUpdate = false;

            if (!canManageTarget) {
                toast.error("권한이 없습니다.");
                return;
            }

            if (status !== user.status || (status === "suspended" && suspendedReason !== (user.suspendedReason || ""))) {
                if (user.status === "pending") {
                    if (status === "active") {
                        await approveUser(user.uid, { approved: true });
                        didUpdate = true;
                    } else if (status === "suspended") {
                        await approveUser(user.uid, {
                            approved: false,
                            reason: suspendedReason || approvalReason || undefined,
                        });
                        didUpdate = true;
                    }
                } else {
                    await updateUserStatus(user.uid, {
                        status,
                        reason: status === "suspended" ? suspendedReason || undefined : undefined,
                    });
                    didUpdate = true;
                }
            }

            if (role !== user.role && isAdmin) {
                await updateUserRole(user.uid, { role });
                didUpdate = true;
            }

            if (didUpdate) {
                toast.success("회원 정보가 업데이트되었습니다.");
                onUpdate();
            } else {
                onClose();
            }
        } catch (error) {
            console.error("회원 정보 업데이트 실패:", error);
            toast.error("회원 정보 업데이트에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleApprove = async (approved: boolean) => {
        try {
            setIsSaving(true);
            await approveUser(user.uid, {
                approved,
                reason: approved ? undefined : approvalReason || undefined,
            });
            toast.success(approved ? "승인되었습니다." : "거부되었습니다.");
            onUpdate();
        } catch (error) {
            console.error("승인 처리 실패:", error);
            toast.error("승인 처리에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!isAdmin) return;
        const confirmed = window.confirm("정말로 이 회원을 삭제할까요?");
        if (!confirmed) return;
        try {
            setIsSaving(true);
            await deleteUser(user.uid);
            toast.success("회원이 삭제되었습니다.");
            onUpdate();
        } catch (error) {
            console.error("회원 삭제 실패:", error);
            toast.error("회원 삭제에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl rounded-card border-card bg-card-bg backdrop-blur-sm text-main-text">
                <DialogHeader>
                    <DialogTitle>회원 상세 정보</DialogTitle>
                    <DialogDescription>회원 정보와 권한을 관리합니다.</DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <img
                            src={user.photoURL || "/default-avatar.png"}
                            alt={user.displayName || "User"}
                            className="w-20 h-20 rounded-full"
                        />
                        <div>
                            <h4 className="text-lg font-semibold text-main-text">
                                {user.displayName || "이름 없음"}
                            </h4>
                            <p className="text-sm text-sub-text">{user.email}</p>
                            <p className="text-xs text-sub-text mt-1">UID: {user.uid}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>가입일</Label>
                            <p className="text-sm text-main-text">{formatDate(user.createdAt)}</p>
                        </div>
                        <div className="space-y-1">
                            <Label>최근 로그인</Label>
                            <p className="text-sm text-main-text">{formatDate(user.lastLoginAt)}</p>
                        </div>
                    </div>

                    {isManager && user.status !== "pending" && (
                        <div className="space-y-2">
                            <Label>상태</Label>
                            <Select
                                value={status}
                                onValueChange={(value) => setStatus(value as UserStatus)}
                                disabled={!canManageTarget}
                            >
                                <SelectTrigger className="rounded-card border-card bg-card text-main-text">
                                    <SelectValue placeholder="상태 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">활성</SelectItem>
                                    <SelectItem value="suspended">정지</SelectItem>
                                    <SelectItem value="pending">대기</SelectItem>
                                </SelectContent>
                            </Select>
                            {status === "suspended" && (
                                <div className="space-y-2">
                                    <Label className="text-xs">정지 사유</Label>
                                    <Textarea
                                        value={suspendedReason}
                                        onChange={(e) => setSuspendedReason(e.target.value)}
                                        placeholder="정지 사유를 입력하세요."
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {isAdmin && (
                        <div className="space-y-2">
                            <Label>권한</Label>
                            <Select
                                value={role}
                                onValueChange={(value) => setRole(value as UserRole)}
                                disabled={user.uid === currentUser?.uid}
                            >
                                <SelectTrigger className="rounded-card border-card bg-card text-main-text">
                                    <SelectValue placeholder="권한 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">일반 회원</SelectItem>
                                    <SelectItem value="manager">매니저</SelectItem>
                                    <SelectItem value="admin">관리자</SelectItem>
                                </SelectContent>
                            </Select>
                            {user.uid === currentUser?.uid && (
                                <p className="text-xs text-sub-text">
                                    본인의 권한은 변경할 수 없습니다.
                                </p>
                            )}
                        </div>
                    )}

                    {isManager && user.status === "pending" && (
                        <div className="rounded-card border border-card bg-card p-4 space-y-3">
                            <div>
                                <p className="text-sm font-medium text-main-text">
                                    승인 대기 사용자
                                </p>
                                <p className="text-xs text-sub-text">
                                    승인 또는 거부를 선택하세요.
                                </p>
                            </div>
                            <Textarea
                                value={approvalReason}
                                onChange={(e) => setApprovalReason(e.target.value)}
                                placeholder="거부 사유를 입력하세요 (선택)"
                            />
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleApprove(true)}
                                    disabled={isSaving || !canManageTarget}
                                >
                                    승인
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleApprove(false)}
                                    disabled={isSaving || !canManageTarget}
                                >
                                    거부
                                </Button>
                            </div>
                        </div>
                    )}

                    {(user.postCount !== undefined || user.commentCount !== undefined) && (
                        <div className="space-y-2">
                            <Label>활동 통계</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-card-bg rounded-card p-3">
                                    <p className="text-xs text-sub-text">작성 게시글</p>
                                    <p className="text-lg font-semibold text-main-text">
                                        {user.postCount || 0}개
                                    </p>
                                </div>
                                <div className="bg-card-bg rounded-card p-3">
                                    <p className="text-xs text-sub-text">작성 댓글</p>
                                    <p className="text-lg font-semibold text-main-text">
                                        {user.commentCount || 0}개
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {isManager && (
                    <DialogFooter className="flex items-center justify-between sm:justify-between">
                        <div>
                            {isAdmin && (
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={isSaving}
                                >
                                    회원 삭제
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose}>
                                취소
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving || !canManageTarget}>
                                {isSaving ? "저장 중..." : "저장"}
                            </Button>
                        </div>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}

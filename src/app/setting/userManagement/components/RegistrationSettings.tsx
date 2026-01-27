"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { UserManagementSettings, RegistrationMode } from "@/types/user";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { fetchUserManagementSettings, updateUserManagementSettings } from "@/queries/userManagement";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import { Save } from "lucide-react";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Settings2 } from "lucide-react";

export default function RegistrationSettings() {
    const [settings, setSettings] = useState<UserManagementSettings>({
        registrationMode: "open",
        whitelist: [],
        blacklist: [],
        autoApprove: false,
        notifyOnNewUser: true,
        updatedAt: null,
        updatedBy: "",
    });
    const [initialSettings, setInitialSettings] = useState<UserManagementSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
			setIsLoading(true);
			const data = await fetchUserManagementSettings();
			setSettings((prev) => {
				const next = { ...prev, ...data };
				setInitialSettings(next);
				return next;
			});
        } catch (error) {
            console.error("설정 조회 실패:", error);
            toast.error("설정을 불러오는데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = useCallback(async () => {
        try {
            setIsSaving(true);
            await updateUserManagementSettings(settings);
            setInitialSettings(settings);
            toast.success("설정이 저장되었습니다.");
        } catch (error) {
            console.error("설정 저장 실패:", error);
            toast.error("설정 저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    }, [settings]);

    const isDirty = useMemo(() => {
        if (!initialSettings) return false;
        return (
            settings.registrationMode !== initialSettings.registrationMode ||
            settings.autoApprove !== initialSettings.autoApprove ||
            settings.notifyOnNewUser !== initialSettings.notifyOnNewUser ||
            settings.whitelist.join("\n") !== initialSettings.whitelist.join("\n") ||
            settings.blacklist.join("\n") !== initialSettings.blacklist.join("\n")
        );
    }, [initialSettings, settings]);

    useSettingStatus("user-management", isDirty ? "dirty" : "saved");

    useSettingHeaderAction(
        <Button
            type="button"
            onClick={saveSettings}
            variant="ghost"
            size="icon"
            disabled={isSaving || isLoading || !isDirty}
            aria-label="저장하기"
            title="저장하기"
            className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
            style={{ transition: "all 0.3s ease-in-out" }}
        >
            <Save size={16} />
        </Button>,
        [isSaving, isLoading, saveSettings]
    );

    const handleModeChange = (mode: RegistrationMode) => {
        setSettings({ ...settings, registrationMode: mode });
    };

    const whitelistText = useMemo(
        () => settings.whitelist.join("\n"),
        [settings.whitelist]
    );
    const blacklistText = useMemo(
        () => settings.blacklist.join("\n"),
        [settings.blacklist]
    );

    if (isLoading) {
        return (
            <div className="bg-card border border-card rounded-card p-4">
                <p className="text-sub-text">로딩 중...</p>
            </div>
        );
    }

    return (
        <Card className="space-y-4">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-sub-text" />
                    신규 가입 설정
                </CardTitle>
                <CardDescription>가입 정책과 허용 목록을 설정합니다.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="space-y-3">
                    <Label className="text-sm font-medium text-main-text">가입 모드</Label>
                    <RadioGroup
                        value={settings.registrationMode}
                        onValueChange={(value) => handleModeChange(value as RegistrationMode)}
                        className="flex flex-wrap gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="open" id="registration-open" />
                            <Label htmlFor="registration-open">전체 허용</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="approval" id="registration-approval" />
                            <Label htmlFor="registration-approval">승인 필요</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="closed" id="registration-closed" />
                            <Label htmlFor="registration-closed">가입 차단</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-main-text">
                            화이트리스트 (이메일/도메인)
                        </Label>
                        <Textarea
                            value={whitelistText}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    whitelist: e.target.value
                                        .split("\n")
                                        .map((item) => item.trim())
                                        .filter(Boolean),
                                }))
                            }
                            placeholder="@company.com\nuser@example.com"
                            className="min-h-[120px]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-main-text">
                            블랙리스트 (이메일/도메인)
                        </Label>
                        <Textarea
                            value={blacklistText}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    blacklist: e.target.value
                                        .split("\n")
                                        .map((item) => item.trim())
                                        .filter(Boolean),
                                }))
                            }
                            placeholder="spam@example.com\n@spam.com"
                            className="min-h-[120px]"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2 text-sm text-sub-text">
                        <Switch
                            checked={settings.autoApprove}
                            onCheckedChange={(checked) =>
                                setSettings((prev) => ({ ...prev, autoApprove: checked }))
                            }
                        />
                        <Label>화이트리스트 자동 승인</Label>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-sub-text">
                        <Switch
                            checked={settings.notifyOnNewUser}
                            onCheckedChange={(checked) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    notifyOnNewUser: checked,
                                }))
                            }
                        />
                        <Label>신규 가입 알림</Label>
                    </div>
                </div>

                <div className="pt-2 text-xs text-sub-text">
                    {settings.registrationMode === "open" &&
                        "누구나 자유롭게 가입할 수 있습니다."}
                    {settings.registrationMode === "approval" &&
                        "관리자 승인 후 가입이 완료됩니다."}
                    {settings.registrationMode === "closed" && "신규 가입이 차단됩니다."}
                </div>
            </CardContent>
        </Card>
    );
}

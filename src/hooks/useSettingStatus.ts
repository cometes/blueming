"use client";

import { useEffect } from "react";
import {
	SettingStatus,
	useSettingStatusContext,
} from "@/contexts/SettingStatusContext";

export function useSettingStatus(sectionId: string, status: SettingStatus) {
	const { setStatus } = useSettingStatusContext();

	useEffect(() => {
		if (!sectionId) return;
		setStatus(sectionId, status);
	}, [sectionId, status, setStatus]);
}

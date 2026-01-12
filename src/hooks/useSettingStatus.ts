"use client";

import { useEffect, useContext } from "react";
import {
	SettingStatus,
	SettingStatusContext,
} from "@/contexts/SettingStatusContext";

export function useSettingStatus(sectionId: string, status: SettingStatus) {
	const context = useContext(SettingStatusContext);

	useEffect(() => {
		if (!sectionId || !context) return;
		context.setStatus(sectionId, status);
	}, [sectionId, status, context]);
}

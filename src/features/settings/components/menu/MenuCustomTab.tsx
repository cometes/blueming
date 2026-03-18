"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface MenuCustomTabProps {
	url: string;
	openInNewTab: boolean;
	onUrlChange: (url: string) => void;
	onOpenInNewTabChange: (value: boolean) => void;
}

export default function MenuCustomTab({
	url,
	openInNewTab,
	onUrlChange,
	onOpenInNewTabChange,
}: MenuCustomTabProps) {
	return (
		<div className="space-y-3">
			<div className="space-y-1.5">
				<Label className="text-xs font-medium text-sub-text">URL</Label>
				<Input
					value={url}
					onChange={(e) => onUrlChange(e.target.value)}
					placeholder="https://..."
					className="h-10 rounded-card border-card bg-card-bg focus:border-card-active"
				/>
			</div>
			<div className="flex items-center space-x-2">
				<Checkbox
					id="openInNewTab"
					checked={openInNewTab}
					onCheckedChange={(v: boolean) => onOpenInNewTabChange(v)}
				/>
				<Label
					htmlFor="openInNewTab"
					className="text-sm font-medium cursor-pointer text-sub-text"
				>
					새 탭에서 열기
				</Label>
			</div>
		</div>
	);
}

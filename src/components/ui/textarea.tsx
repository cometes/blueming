"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
	HTMLTextAreaElement,
	React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
	<textarea
		ref={ref}
		className={cn(
			"min-h-[80px] w-full rounded-card border border-card bg-card px-3 py-2 text-sm text-main-text",
			"ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary/40 focus-visible:ring-offset-2",
			"disabled:cursor-not-allowed disabled:opacity-50",
			className
		)}
		{...props}
	/>
));
Textarea.displayName = "Textarea";

export { Textarea };

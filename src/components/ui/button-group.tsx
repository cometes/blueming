import * as React from "react";
import { cn } from "@/shared/lib/utils";

const ButtonGroup = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		data-slot="button-group"
		className={cn("flex items-center", className)}
		{...props}
	/>
));
ButtonGroup.displayName = "ButtonGroup";

export { ButtonGroup };

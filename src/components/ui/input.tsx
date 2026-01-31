// import * as React from "react"

// import { cn } from "@/lib/utils"

// function Input({ className, type, ...props }: React.ComponentProps<"input">) {
//   return (
//     <input
//       type={type}
//       data-slot="input"
//       className={cn(
//         "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
//         "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
//         "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
//         className
//       )}
//       {...props}
//     />
//   )
// }

// export { Input }

import * as React from "react";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	startIcon?: LucideIcon;
	endIcon?: LucideIcon;
	onEndIconClick?: () => void;
	endIconAriaLabel?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{ className, type, startIcon, endIcon, onEndIconClick, endIconAriaLabel, ...props },
		ref
	) => {
		const StartIcon = startIcon;
		const EndIcon = endIcon;

		return (
			<div className="w-full relative">
				{StartIcon && (
					<div className="absolute left-1.5 top-1/2 transform -translate-y-1/2">
						<StartIcon size={18} className="text-muted-foreground" />
					</div>
				)}
				<input
					type={type}
					className={cn(
						"flex h-9 w-full rounded-card border border-card bg-card-bg py-2 px-4 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-theme-primary focus-visible:ring-1 focus-visible:ring-theme-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
						startIcon ? "pl-8" : "",
						endIcon ? "pr-8" : "",
						className
					)}
					ref={ref}
					{...props}
					style={{
						transition: "all 0.3s ease-in-out",
						...props.style,
					}}
				/>
				{EndIcon && (
					<div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
						{onEndIconClick ? (
							<button
								type="button"
								onClick={onEndIconClick}
								aria-label={endIconAriaLabel || "Clear"}
								className="flex items-center justify-center text-muted-foreground hover:text-theme-primary transition-colors"
							>
								<EndIcon size={18} />
							</button>
						) : (
							<EndIcon size={18} />
						)}
					</div>
				)}
			</div>
		);
	}
);
Input.displayName = "Input";

export { Input };

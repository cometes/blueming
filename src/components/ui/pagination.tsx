import * as React from "react";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	MoreHorizontalIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
	return (
		<nav
			role="navigation"
			aria-label="pagination"
			data-slot="pagination"
			className={cn("mx-auto flex w-full justify-center", className)}
			{...props}
		/>
	);
}

function PaginationContent({
	className,
	...props
}: React.ComponentProps<"ul">) {
	return (
		<ul
			data-slot="pagination-content"
			className={cn("flex flex-row items-center gap-1", className)}
			{...props}
		/>
	);
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
	return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
	isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
	React.ComponentProps<"a">;

function PaginationLink({
	className,
	isActive,
	size = "icon",
	...props
}: PaginationLinkProps) {
	return (
		<a
			aria-current={isActive ? "page" : undefined}
			data-slot="pagination-link"
			data-active={isActive}
			className={cn(
				buttonVariants({
					variant: isActive ? "outline" : "ghost",
					size,
				}),
				className,
				isActive
					? "bg-card-bg border-card text-theme-primary hover:bg-theme-primary hover:text-gray-200 "
					: "hover:bg-theme-primary hover:text-gray-200",
				"text-gray-200 hover:border-none"
			)}
			style={{ transition: "background-color 200ms, color 200ms, border-color 200ms" }}
			{...props}
		/>
	);
}

function PaginationPrevious({
	className,
	...props
}: React.ComponentProps<typeof PaginationLink>) {
	return (
		<PaginationLink
			aria-label="Go to previous page"
			size="default"
			className={cn(
				"group gap-1 px-2.5 sm:pl-2.5 hover:!bg-transparent hover:text-theme-primary",
				className
			)}
			{...props}
		>
			<ChevronLeftIcon
				className="text-gray-200 group-hover:text-theme-primary"
				style={{ transition: "color 200ms" }}
			/>
			{/* <span className="hidden sm:block">Previous</span> */}
		</PaginationLink>
	);
}

function PaginationNext({
	className,
	...props
}: React.ComponentProps<typeof PaginationLink>) {
	return (
		<PaginationLink
			aria-label="Go to next page"
			size="default"
			className={cn(
				"group gap-1 px-2.5 sm:pr-2.5 hover:!bg-transparent hover:text-theme-primary",
				className
			)}
			{...props}
		>
			{/* <span className="hidden sm:block">Next</span> */}
			<ChevronRightIcon
				className="text-gray-200 group-hover:text-theme-primary"
				style={{ transition: "color 200ms" }}
			/>
		</PaginationLink>
	);
}

function PaginationEllipsis({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			aria-hidden
			data-slot="pagination-ellipsis"
			className={cn("flex size-9 items-center justify-center", className)}
			{...props}
		>
			<MoreHorizontalIcon className="size-4" />
			{/* <span className="sr-only">More pages</span> */}
		</span>
	);
}

export {
	Pagination,
	PaginationContent,
	PaginationLink,
	PaginationItem,
	PaginationPrevious,
	PaginationNext,
	PaginationEllipsis,
};

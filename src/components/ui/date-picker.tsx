"use client";

import * as React from "react";
import DatePickerLib, { registerLocale } from "react-datepicker";
import { Calendar as CalendarIcon } from "lucide-react";
import { ko } from "date-fns/locale/ko";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface DatePickerProps {
	date?: Date;
	onDateChange?: (date?: Date) => void;
	label?: string;
	placeholder?: string;
	fromYear?: number;
	toYear?: number;
	className?: string;
	buttonClassName?: string;
}

const DateButton = React.forwardRef<
	HTMLButtonElement,
	{
		value?: string;
		onClick?: () => void;
		placeholder?: string;
		className?: string;
	}
>(({ value, onClick, placeholder, className }, ref) => (
	<Button
		type="button"
		variant="outline"
		onClick={onClick}
		ref={ref}
		className={cn(
			"justify-start text-left font-normal rounded-card border-card bg-card-bg w-full",
			!value && "text-sub-text",
			className
		)}
	>
		<CalendarIcon />
		{value || <span>{placeholder}</span>}
	</Button>
));
DateButton.displayName = "DateButton";

registerLocale("ko", ko);

export function DatePicker({
	date,
	onDateChange,
	label,
	placeholder = "Pick a date",
	fromYear,
	toYear,
	className,
	buttonClassName,
}: DatePickerProps) {
	const [internalDate, setInternalDate] = React.useState<Date>();
	const selectedDate = date ?? internalDate;

	const handleSelect = (next: Date | null) => {
		if (onDateChange) {
			onDateChange(next || undefined);
		} else {
			setInternalDate(next || undefined);
		}
	};

	return (
		<div className={cn(label ? "space-y-2" : "space-y-0", className)}>
			{label && (
				<Label className="text-xs font-medium text-sub-text">{label}</Label>
			)}
			<DatePickerLib
				selected={selectedDate}
				onChange={handleSelect}
				locale="ko"
				dateFormat="yyyy.MM.dd (EEE)"
				placeholderText={placeholder}
				minDate={fromYear ? new Date(fromYear, 0, 1) : undefined}
				maxDate={toYear ? new Date(toYear, 11, 31) : undefined}
				customInput={
					<DateButton placeholder={placeholder} className={buttonClassName} />
				}
				calendarClassName="react-datepicker__calendar"
				wrapperClassName="relative w-full"
				popperClassName="react-datepicker-popper z-50"
				popperPlacement="bottom-start"
				dayClassName={() => "react-datepicker__day-cell"}
			/>
		</div>
	);
}

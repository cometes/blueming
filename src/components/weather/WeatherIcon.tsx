import { cn } from "@/lib/utils";

type WeatherCondition =
	| "sunny"
	| "rainy"
	| "cloudy"
	| "thunder-storm"
	| "flurries"
	| "sun-shower";

interface WeatherIconProps {
	condition: WeatherCondition;
	className?: string;
}

export default function WeatherIcon({ condition, className }: WeatherIconProps) {
	return (
		<div className={cn("weather-icon-container", className)}>
			<div className={`icon ${condition}`}>
				{condition === "sunny" && (
					<div className="sun">
						<div className="rays" />
					</div>
				)}

				{condition === "rainy" && (
					<>
						<div className="cloud" />
						<div className="rain" />
					</>
				)}

				{condition === "cloudy" && (
					<>
						<div className="cloud" />
						<div className="cloud" />
					</>
				)}

				{condition === "thunder-storm" && (
					<>
						<div className="cloud" />
						<div className="lightning">
							<div className="bolt" />
							<div className="bolt" />
						</div>
					</>
				)}

				{condition === "flurries" && (
					<>
						<div className="cloud" />
						<div className="snow">
							<div className="flake" />
							<div className="flake" />
						</div>
					</>
				)}

				{condition === "sun-shower" && (
					<>
						<div className="cloud" />
						<div className="sun">
							<div className="rays" />
						</div>
						<div className="rain" />
					</>
				)}
			</div>
		</div>
	);
}

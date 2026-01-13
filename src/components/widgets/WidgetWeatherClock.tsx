"use client";

import { useEffect, useState, useMemo } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { getWeather, type WeatherData } from "@/queries/getWeather";
import WeatherIcon from "@/components/weather/WeatherIcon";
import { MapPin } from "lucide-react";

export default function WidgetWeatherClock() {
	const { main } = useSettings();
	const weatherClockSettings = main?.weatherClock;

	const [weather, setWeather] = useState<WeatherData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentTime, setCurrentTime] = useState(new Date());

	const enabled = weatherClockSettings?.enabled ?? true;
	const city = weatherClockSettings?.city || "Seoul";

	// Fetch weather data
	useEffect(() => {
		if (!enabled) return;

		let isActive = true;
		let requestId = 0;

		const fetchWeatherData = async () => {
			const currentId = ++requestId;
			try {
				setIsLoading(true);
				setError(null);
				const data = await getWeather(city);
				if (!isActive || currentId !== requestId) return;
				setWeather(data);
			} catch (err) {
				if (!isActive || currentId !== requestId) return;
				console.error("Failed to fetch weather:", err);
				setError(
					err instanceof Error ? err.message : "날씨 정보를 불러올 수 없습니다"
				);
			} finally {
				if (!isActive || currentId !== requestId) return;
				setIsLoading(false);
			}
		};

		fetchWeatherData();

		// Refresh every 10 minutes
		const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);

		return () => {
			isActive = false;
			clearInterval(interval);
		};
	}, [city, enabled]);

	// Update clock every second
	useEffect(() => {
		if (!enabled || !weather) return;

		const updateTime = () => {
			// Calculate local time based on timezone offset
			const now = new Date();
			const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
			const localTime = new Date(utcTime + weather.timezone * 1000);
			setCurrentTime(localTime);
		};

		updateTime();
		const interval = setInterval(updateTime, 1000);

		return () => clearInterval(interval);
	}, [enabled, weather]);

	const formattedDate = useMemo(() => {
		if (!currentTime) return "";
		const month = currentTime.getMonth() + 1;
		const day = currentTime.getDate();
		const weekday = ["일", "월", "화", "수", "목", "금", "토"][currentTime.getDay()];
		return `${month}월 ${day}일 ${weekday}요일`;
	}, [currentTime]);

	const formattedTime = useMemo(() => {
		if (!currentTime) return "";
		const hours = String(currentTime.getHours()).padStart(2, "0");
		const minutes = String(currentTime.getMinutes()).padStart(2, "0");
		return `${hours}:${minutes}`;
	}, [currentTime]);

	if (!enabled) {
		return (
			<div className="widget-wrapper flex items-center justify-center">
				<div className="text-sm text-sub-text">날씨&시계 위젯이 비활성화되어 있어요</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="widget-wrapper flex items-center justify-center">
				<div className="text-sm text-sub-text">날씨 정보를 불러오는 중...</div>
			</div>
		);
	}

	if (error || !weather) {
		return (
			<div className="widget-wrapper flex items-center justify-center">
				<div className="text-sm text-sub-text">{error || "날씨 정보를 불러올 수 없습니다"}</div>
			</div>
		);
	}

	return (
		<div className="widget-wrapper weather-widget">
			<div className="weather-widget-shell">
				<div className="weather-widget-card">
					<div className="weather-widget-temp">{weather.temperature}°</div>
					<div className="weather-widget-icon">
						<WeatherIcon condition={weather.condition} />
					</div>
					<div className="weather-widget-city">
						<MapPin className="weather-widget-pin" />
						<span>{weather.city}</span>
					</div>
					<div className="weather-widget-date">{formattedDate}</div>
					<div className="weather-widget-time">{formattedTime}</div>
					{weather.description ? (
						<div className="weather-widget-desc">{weather.description}</div>
					) : null}
				</div>
			</div>
		</div>
	);
}

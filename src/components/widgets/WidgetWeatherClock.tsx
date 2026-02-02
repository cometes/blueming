"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { getWeather, type WeatherData } from "@/queries/getWeather";
import { CACHE_POLICY } from "@/queries/cachePolicy";
import WeatherIcon from "@/components/weather/WeatherIcon";
import { MapPin } from "lucide-react";
import WidgetSkeleton from "@/components/widgets/WidgetSkeleton";

const WEATHER_REFRESH_MS = CACHE_POLICY.weatherStaleMs;

export default function WidgetWeatherClock({ onReady }: { onReady?: () => void }) {
    const { main } = useSettings();
    const weatherClockSettings = main?.weatherClock;

    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const onReadyRef = useRef(onReady);

    useEffect(() => {
        onReadyRef.current = onReady;
    }, [onReady]);

    const enabled = weatherClockSettings?.enabled ?? true;
    const city = weatherClockSettings?.city || "Seoul";
    const backgroundImage = weatherClockSettings?.backgroundImage || "";

    // Fetch weather data
    useEffect(() => {
        if (!enabled) {
            onReadyRef.current?.();
            return;
        }

        let isActive = true;
        let requestId = 0;

        const fetchWeatherData = async () => {
            const currentId = ++requestId;
            try {
                setIsLoading(true);
                setError(null);
                const data = await getWeather(city, { staleTimeMs: WEATHER_REFRESH_MS });
                if (!isActive || currentId !== requestId) return;
                setWeather(data);
                onReadyRef.current?.();
            } catch (err) {
                if (!isActive || currentId !== requestId) return;
                console.error("Failed to fetch weather:", err);
                setError(
                    err instanceof Error ? err.message : "날씨 정보를 불러올 수 없습니다"
                );
                onReadyRef.current?.();
            } finally {
                if (!isActive || currentId !== requestId) return;
                setIsLoading(false);
            }
        };

        fetchWeatherData();
        let interval: ReturnType<typeof setInterval> | undefined;
        if (document.visibilityState === "visible") {
            interval = setInterval(fetchWeatherData, WEATHER_REFRESH_MS);
        }
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                fetchWeatherData();
                if (!interval) {
                    interval = setInterval(fetchWeatherData, WEATHER_REFRESH_MS);
                }
                return;
            }
            if (interval) {
                clearInterval(interval);
                interval = undefined;
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            isActive = false;
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [city, enabled]);

    // Update clock every second
    useEffect(() => {
        if (!enabled || !weather) return;
        const updateTime = () => {
            const now = new Date();
            const utcTime = now.getTime();
            const localTime = new Date(utcTime + weather.timezone * 1000);
            setCurrentTime(localTime);
        };
        updateTime();
        let interval: ReturnType<typeof setInterval> | undefined;
        if (document.visibilityState === "visible") {
            interval = setInterval(updateTime, 1000);
        }
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                updateTime();
                if (!interval) {
                    interval = setInterval(updateTime, 1000);
                }
                return;
            }
            if (interval) {
                clearInterval(interval);
                interval = undefined;
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [enabled, weather]);

    const formattedDate = useMemo(() => {
        if (!currentTime) return "";
        const month = currentTime.getUTCMonth() + 1;
        const day = currentTime.getUTCDate();
        const weekday = ["일", "월", "화", "수", "목", "금", "토"][
            currentTime.getUTCDay()
        ];
        return `${month}월 ${day}일 ${weekday}요일`;
    }, [currentTime]);

    const formattedTime = useMemo(() => {
        if (!currentTime) return { period: "", time: "" };
        const rawHours = currentTime.getUTCHours();
        const period = rawHours >= 12 ? "오후" : "오전";
        const hours = rawHours % 12 || 12;
        const minutes = String(currentTime.getUTCMinutes()).padStart(2, "0");
        return { period, time: `${hours}:${minutes}` };
    }, [currentTime]);

    if (isLoading) {
        return <WidgetSkeleton className="rounded-2xl" />;
    }

    if (!enabled || error || !weather) {
        const message = !enabled
            ? "위젯 꺼짐"
            : (error || "날씨 오류");

        return (
            <div className="widget-wrapper flex items-center justify-center h-full w-full">
                <div
                    className="text-sub-text text-center"
                    style={{ fontSize: 'clamp(0.8rem, 10cqmin, 1.5rem)' }}
                >
                    {message}
                </div>
            </div>
        );
    }

    return (
        <div
            className="widget-wrapper weather-widget relative overflow-hidden h-full w-full"
            style={{
                containerType: "size",
                ...(backgroundImage && {
                    backgroundImage: `url("${backgroundImage}")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }),
            } as React.CSSProperties}
        >
            {backgroundImage && (
                <div className="absolute inset-0 bg-black/20 pointer-events-none" />
            )}

            <div
                className="weather-widget-shell h-full relative z-10 box-border"
                style={{
                    // 패딩에도 clamp 적용: 최소 12px, 권장 6cqmin, 최대 30px
                    padding: "clamp(8px, 3cqmin, 24px)",
                    paddingTop: "clamp(4px, 1cqmin, 12px)"
                }}
            >
                <div
                    className={`weather-widget-card h-full flex flex-col justify-between ${backgroundImage ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" : ""
                        }`}
                >
                    {/* 상단: 기온, 도시, 아이콘 */}
                    <div className="flex justify-between items-center">
                        <div className="weather-widget-temp leading-none">
                            {/* 기온: 최소 1.5rem ~ 최대 4.5rem */}
                            <p className="font-medium font-title" style={{ fontSize: "clamp(1.5rem, 24cqmin, 2.4rem)" }}>
                                {weather.temperature}°
                            </p>
                            <div className="weather-widget-city flex items-center mt-[1cqmin]">
                                <MapPin
                                    style={{
                                        // 핀 아이콘 크기 제한
                                        width: "clamp(0.8rem, 9cqmin, 1rem)",
                                        height: "clamp(0.8rem, 10cqmin, 1rem)"
                                    }}
                                />
                                {/* 도시 이름: 최소 0.8rem ~ 최대 1.8rem */}
                                <span className="ml-[1cqmin]" style={{ fontSize: "clamp(0.8rem, 12cqmin, 1.2rem)" }}>
                                    {weather.city}
                                </span>
                            </div>
                        </div>
                        <div className="weather-widget-icon">
                            {/* 날씨 아이콘: 
                                이 아이콘은 폰트 크기의 12배로 그려집니다.
                                따라서 폰트 크기를 작게 잡아야 합니다.
                                (최소 3px -> 아이콘 36px / 최대 14px -> 아이콘 168px) 
                            */}
                            <div style={{ fontSize: "clamp(3px, 4cqmin, 16px)" }}>
                                <WeatherIcon condition={weather.condition} />
                            </div>
                        </div>
                    </div>

                    {/* 하단: 설명, 날짜, 시간 */}
                    <div className="flex items-end justify-between">
                        {weather.description ? (
                            <div
                                className="weather-widget-desc break-keep leading-tight"
                                style={{
                                    // 설명: 최소 0.75rem ~ 최대 1.5rem
                                    fontSize: "clamp(0.75rem, 12cqmin, 1.2rem)",
                                    maxWidth: "45%"
                                }}
                            >
                                {weather.description}
                            </div>
                        ) : <div />}

                        <div className="flex flex-col items-end">
                            <div
                                className="weather-widget-date"
                                style={{
                                    // 날짜: 최소 0.75rem ~ 최대 1.2rem
                                    fontSize: "clamp(0.75rem, 10cqmin, 1rem)",
                                    marginBottom: "0.5cqmin"
                                }}
                            >
                                {formattedDate}
                            </div>
                            <div
                                className="weather-widget-time font-semibold leading-none font-title"
                                style={{
                                    // 시간: 최소 1.5rem ~ 최대 4.5rem
                                    fontSize: "clamp(1.5rem, 24cqmin, 3rem)"
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "clamp(0.7rem, 10cqmin, 1.1rem)",
                                        marginRight: "0.3em"
                                    }}
                                >
                                    {formattedTime.period}
                                </span>
                                {formattedTime.time}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

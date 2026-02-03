import { NextResponse } from "next/server";

export const jsonOk = (data: unknown, init?: ResponseInit) =>
	NextResponse.json(data, init);

export const jsonError = (
	status: number,
	message: string,
	extra?: Record<string, unknown>
) =>
	NextResponse.json(
		{ error: message, ...(extra ? extra : {}) },
		{ status }
	);

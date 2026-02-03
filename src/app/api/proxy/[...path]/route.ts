import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROXY_BASE =
	process.env.API_PROXY_TARGET ?? "https://api-w5buphcleq-du.a.run.app";

const handleProxy = async (request: NextRequest) => {
	const { pathname, search } = new URL(request.url);
	const targetPath = pathname.replace(/^\/api\/proxy/, "");
	const targetUrl = `${PROXY_BASE}${targetPath}${search}`;

	const headers = new Headers(request.headers);
	headers.delete("host");
	headers.delete("content-length");
	const requestHost = request.headers.get("host");
	if (requestHost) {
		headers.set("x-forwarded-host", requestHost);
	}
	headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

	const response = await fetch(targetUrl, {
		method: request.method,
		headers,
		body: request.body,
		cache: "no-store",
		redirect: "manual",
		// Node.js fetch requires duplex when streaming a body.
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		duplex: "half",
	});

	const responseHeaders = new Headers(response.headers);

	return new NextResponse(response.body, {
		status: response.status,
		headers: responseHeaders,
	});
};

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
export const HEAD = handleProxy;

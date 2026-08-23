/** emitNotification의 수신자 필터링(자기 제외·중복 제거·null 제거) 검증 */
jest.mock("firebase-admin", () => ({
	__esModule: true,
	default: {
		firestore: { FieldValue: { serverTimestamp: () => "TS" } },
	},
}));

const writes: Array<{ path: string; payload: Record<string, unknown> }> = [];

const makeColRef = (path: string): Record<string, unknown> => ({
	path,
	doc: (id = "auto") => makeDocRef(`${path}/${id}`),
	count: () => ({ get: async () => ({ data: () => ({ count: 0 }) }) }),
	orderBy: () => makeColRef(path),
	limit: () => makeColRef(path),
	where: () => makeColRef(path),
	get: async () => ({ docs: [] }),
});

const makeDocRef = (path: string): Record<string, unknown> => ({
	path,
	collection: (name: string) => makeColRef(`${path}/${name}`),
});

const fakeDb = {
	batch: () => ({
		set: (ref: { path: string }, payload: Record<string, unknown>) => {
			writes.push({ path: ref.path, payload });
		},
		delete: jest.fn(),
		commit: jest.fn(async () => {}),
	}),
	collection: (name: string) => makeColRef(name),
};

jest.mock("@/app/api/_lib/admin", () => ({
	getDb: () => fakeDb,
}));

import { emitNotification } from "@/app/api/_lib/notifications";

describe("emitNotification", () => {
	beforeEach(() => {
		writes.length = 0;
	});

	const actor = { uid: "me", name: "나", avatarUrl: "", anon: false };
	const base = {
		type: "comment" as const,
		category: "comment" as const,
		message: "테스트",
		excerpt: "본문",
		link: "/library/1",
	};

	it("자기 자신·중복·빈 값은 수신자에서 제외", async () => {
		await emitNotification({
			actor,
			recipients: ["me", "u1", "u1", "u2", null, undefined, ""],
			...base,
		});
		const paths = writes.map((w) => w.path).sort();
		expect(paths).toEqual([
			"users/u1/notifications/auto",
			"users/u2/notifications/auto",
		]);
	});

	it("수신자가 없으면 아무것도 쓰지 않음", async () => {
		await emitNotification({ actor, recipients: ["me", null], ...base });
		expect(writes).toHaveLength(0);
	});

	it("payload에 read:false와 excerpt 80자 절단 적용", async () => {
		await emitNotification({
			actor,
			recipients: ["u1"],
			...base,
			excerpt: "가".repeat(120),
		});
		expect(writes[0].payload.read).toBe(false);
		expect((writes[0].payload.excerpt as string).length).toBe(80);
		expect(writes[0].payload.actor).toEqual({
			uid: "me",
			name: "나",
			avatarUrl: "",
			anon: false,
		});
	});
});

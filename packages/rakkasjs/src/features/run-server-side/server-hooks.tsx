import type { ServerHooks } from "../../runtime/hattip-handler";
import { parse } from "@brillout/json-s";
import devalue from "devalue";

const runServerSideServerHooks: ServerHooks = {
	middleware: {
		beforeApiRoutes: async (ctx) => {
			// TODO: Build ID
			if (!ctx.url.pathname.startsWith("/_data/development/")) return undefined;

			const [, , , moduleId, counter, ...closure] = ctx.url.pathname
				.split("/")
				.map((s) => decodeURIComponent(s));

			const closureContents = closure.map(parse);

			const manifest = await import(
				"virtual:rakkasjs:run-server-side:manifest"
			);

			const importer = manifest.default[moduleId];
			if (!importer) return;

			const module = await importer();
			if (!module.$runServerSide$) return;

			const fn = module.$runServerSide$[Number(counter)];

			// TODO: Server-side context
			const result = await fn(closureContents, {});

			return new Response(devalue(result));
		},
	},
};

export default runServerSideServerHooks;

import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/DevicesPage.tsx");const useEffect = __vite__cjsImport0_react["useEffect"]; const useMemo = __vite__cjsImport0_react["useMemo"]; const useState = __vite__cjsImport0_react["useState"];const _jsxDEV = __vite__cjsImport14_react_jsxDevRuntime["jsxDEV"]; const _Fragment = __vite__cjsImport14_react_jsxDevRuntime["Fragment"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=26127ef3";
import { useNavigate } from "/node_modules/.vite/deps/react-router-dom.js?v=26127ef3";
import { DeviceCard } from "/src/components/devices/DeviceCard.tsx";
import { Em, PageHeader } from "/src/components/layout/PageHeader.tsx";
import { Button } from "/src/components/ui/Button.tsx";
import { SearchInput } from "/src/components/ui/SearchInput.tsx";
import { StatCard } from "/src/components/ui/StatCard.tsx";
import { apps } from "/src/data/mock.ts";
import { LayoutGrid, List } from "/node_modules/.vite/deps/lucide-react.js?v=26127ef3";
import { cn } from "/src/lib/utils.ts";
import { formatDuration } from "/src/lib/utils.ts";
import { DeviceStatusBadge } from "/src/components/ui/StatusBadges.tsx";
import { Apple, Smartphone } from "/node_modules/.vite/deps/lucide-react.js?v=26127ef3";
import { getHealth, HUB, listHubDevices } from "/src/lib/hub.ts";
var _jsxFileName = "/Users/sameershaikh_uts/Projects/xpedite-for-mac/relay-console/src/pages/DevicesPage.tsx";
import __vite__cjsImport14_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=26127ef3";
var _s = $RefreshSig$();
export function DevicesPage() {
	_s();
	const navigate = useNavigate();
	const [devices, setDevices] = useState([]);
	const [hubOnline, setHubOnline] = useState(null);
	const [appiumOnline, setAppiumOnline] = useState(false);
	const [hubError, setHubError] = useState(null);
	const [location, setLocation] = useState("local");
	const [status, setStatus] = useState("all");
	const [platform, setPlatform] = useState("all");
	const [kind, setKind] = useState("all");
	const [query, setQuery] = useState("");
	const [view, setView] = useState("grid");
	const [toast, setToast] = useState(null);
	async function refreshDevices() {
		try {
			const health = await getHealth();
			setHubOnline(true);
			setAppiumOnline(health.appium);
			const { devices: list } = await listHubDevices();
			setDevices(list.map((d) => ({
				id: d.udid,
				name: d.name,
				platform: d.platform === "ios" ? "ios" : "android",
				osVersion: d.osVersion,
				udid: d.udid,
				node: d.node,
				status: d.status === "ready" ? "ready" : d.status === "offline" ? "offline" : "busy",
				kind: d.kind === "virtual" ? "virtual" : "real",
				usageSeconds: d.usageSeconds || 0,
				model: d.model || d.udid,
				location: "local",
				busyBy: d.busyBy,
				busySince: d.busySince,
				busyMine: d.busyMine,
				sessionId: d.sessionId,
				sessionKind: d.sessionKind,
				testName: d.testName,
				allowViewerInteract: d.allowViewerInteract,
				note: d.note
			})));
			setHubError(null);
		} catch (e) {
			setHubOnline(false);
			setAppiumOnline(false);
			setDevices([]);
			setHubError(e.message || "Hub unreachable");
		}
	}
	useEffect(() => {
		refreshDevices();
		const t = window.setInterval(refreshDevices, 5e3);
		return () => window.clearInterval(t);
	}, []);
	const scoped = useMemo(() => devices.filter((d) => d.location === location), [devices, location]);
	const stats = useMemo(() => {
		const total = scoped.length;
		const ready = scoped.filter((d) => d.status === "ready").length;
		const busy = scoped.filter((d) => d.status === "busy").length;
		const offline = scoped.filter((d) => d.status === "offline").length;
		const ios = scoped.filter((d) => d.platform === "ios").length;
		const android = scoped.filter((d) => d.platform === "android").length;
		const real = scoped.filter((d) => d.kind === "real").length;
		const virtual = scoped.filter((d) => d.kind === "virtual").length;
		return {
			total,
			ready,
			busy,
			offline,
			ios,
			android,
			real,
			virtual
		};
	}, [scoped]);
	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return scoped.filter((d) => {
			if (status !== "all" && d.status !== status) return false;
			if (platform !== "all" && d.platform !== platform) return false;
			if (kind !== "all" && d.kind !== kind) return false;
			if (!q) return true;
			return d.name.toLowerCase().includes(q) || d.udid.toLowerCase().includes(q) || d.model.toLowerCase().includes(q);
		});
	}, [
		scoped,
		status,
		platform,
		kind,
		query
	]);
	function flash(message) {
		setToast(message);
		window.setTimeout(() => setToast(null), 2200);
	}
	function onUse(device) {
		if (device.status === "offline" || device.status === "blocked") {
			flash(device.note ? `${device.name}: ${device.note}` : `${device.name} is not available.`);
			return;
		}
		if (device.sessionKind === "automation") {
			flash(`${device.name} is running automation. Use View Automation.`);
			return;
		}
		if (device.status === "busy" && !device.busyMine) {
			flash(`${device.name} is in use by ${device.busyBy || "another user"}.`);
			return;
		}
		if (!hubOnline) {
			flash("Local hub is offline. Start relay-hub first.");
			return;
		}
		const defaultApp = device.platform === "ios" ? apps.find((a) => a.platform === "ios" && a.packageId === "com.apple.mobilesafari") ?? apps.find((a) => a.platform === "ios") : apps.find((a) => a.platform === "android" && a.packageId === "com.android.chrome") ?? apps.find((a) => a.platform === "android");
		flash(`Opening real session on ${device.name}â¦`);
		navigate(`/devices/${encodeURIComponent(device.udid)}/session?platform=${device.platform}${defaultApp ? `&app=${defaultApp.id}` : ""}`);
	}
	function onView(device) {
		if (!device.sessionId) {
			flash(`${device.name} has no active session to view.`);
			return;
		}
		flash(`Opening live view for ${device.name}â¦`);
		navigate(`/devices/${encodeURIComponent(device.udid)}/session?platform=${device.platform}&view=1&sessionId=${encodeURIComponent(device.sessionId)}`);
	}
	function onBlock(device) {
		flash(`Block is local-only for ${device.name} (not sent to device)`);
		setDevices((prev) => prev.map((d) => d.id === device.id ? {
			...d,
			status: d.status === "blocked" ? "ready" : "blocked"
		} : d));
	}
	return /* @__PURE__ */ _jsxDEV("div", { children: [
		/* @__PURE__ */ _jsxDEV("div", {
			className: "mb-4 flex flex-wrap items-center gap-2",
			children: [
				/* @__PURE__ */ _jsxDEV(Tab, {
					active: location === "local",
					onClick: () => setLocation("local"),
					label: `Local devices ${stats.total}`
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 171,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV(Tab, {
					active: location === "cloud",
					onClick: () => setLocation("cloud"),
					label: "Cloud devices"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 176,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "ml-auto flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ _jsxDEV("span", {
							className: cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs", hubOnline ? "border-pass/40 text-pass" : "border-danger/40 text-danger"),
							children: [
								/* @__PURE__ */ _jsxDEV("span", { className: cn("size-1.5 rounded-full", hubOnline ? "bg-pass" : "bg-danger") }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 184,
									columnNumber: 13
								}, this),
								"Hub ",
								hubOnline ? "online" : "offline"
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 178,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV("span", {
							className: cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs", appiumOnline ? "border-pass/40 text-pass" : "border-warn/40 text-warn"),
							children: ["Appium ", appiumOnline ? "ready" : "down"]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 187,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV(Button, {
							size: "sm",
							variant: "secondary",
							onClick: refreshDevices,
							children: "Refresh devices"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 195,
							columnNumber: 11
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 177,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 170,
			columnNumber: 7
		}, this),
		hubError ? /* @__PURE__ */ _jsxDEV("div", {
			className: "mb-4 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn",
			children: [
				"Local hub not reachable (",
				HUB,
				"): ",
				hubError,
				/* @__PURE__ */ _jsxDEV("div", {
					className: "mt-1 text-xs text-mist",
					children: [
						"Mac: run ",
						/* @__PURE__ */ _jsxDEV("code", {
							className: "text-fog",
							children: "./scripts/mac-start.sh"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 205,
							columnNumber: 22
						}, this),
						" from the project folder, or double-click",
						" ",
						/* @__PURE__ */ _jsxDEV("code", {
							className: "text-fog",
							children: "Xpedite Start.app"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 206,
							columnNumber: 13
						}, this),
						". Then plug in a phone or start an emulator and click Refresh."
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 204,
					columnNumber: 11
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 202,
			columnNumber: 9
		}, this) : null,
		!hubError && devices.length === 0 ? /* @__PURE__ */ _jsxDEV("div", {
			className: "mb-4 rounded-xl border border-line bg-ink-2/70 px-4 py-3 text-sm text-fog",
			children: "No devices found. Boot an iOS Simulator (open Simulator app) or connect Android via ADB, then click Refresh devices."
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 212,
			columnNumber: 9
		}, this) : null,
		/* @__PURE__ */ _jsxDEV(PageHeader, {
			eyebrow: "Device fleet Â· real Appium",
			title: /* @__PURE__ */ _jsxDEV(_Fragment, { children: ["Every device. ", /* @__PURE__ */ _jsxDEV(Em, { children: "One console." }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 221,
				columnNumber: 27
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 220,
				columnNumber: 11
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 217,
			columnNumber: 7
		}, this),
		/* @__PURE__ */ _jsxDEV("div", {
			className: "grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8",
			children: [
				/* @__PURE__ */ _jsxDEV(StatCard, {
					label: "Total",
					value: stats.total,
					active: status === "all" && platform === "all" && kind === "all",
					onClick: () => {
						setStatus("all");
						setPlatform("all");
						setKind("all");
					}
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 227,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV(StatCard, {
					label: "Ready",
					value: stats.ready,
					tone: "pass",
					active: status === "ready",
					onClick: () => setStatus(status === "ready" ? "all" : "ready")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 228,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV(StatCard, {
					label: "Busy",
					value: stats.busy,
					tone: "warn",
					active: status === "busy",
					onClick: () => setStatus(status === "busy" ? "all" : "busy")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 229,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV(StatCard, {
					label: "Offline",
					value: stats.offline,
					tone: "danger",
					active: status === "offline",
					onClick: () => setStatus(status === "offline" ? "all" : "offline")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 230,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV(StatCard, {
					label: "iOS",
					value: stats.ios,
					active: platform === "ios",
					onClick: () => setPlatform(platform === "ios" ? "all" : "ios")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 231,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV(StatCard, {
					label: "Android",
					value: stats.android,
					active: platform === "android",
					onClick: () => setPlatform(platform === "android" ? "all" : "android")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 232,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV(StatCard, {
					label: "Real",
					value: stats.real,
					active: kind === "real",
					onClick: () => setKind(kind === "real" ? "all" : "real")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 233,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV(StatCard, {
					label: "Virtual",
					value: stats.virtual,
					active: kind === "virtual",
					onClick: () => setKind(kind === "virtual" ? "all" : "virtual")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 234,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 226,
			columnNumber: 7
		}, this),
		/* @__PURE__ */ _jsxDEV("div", {
			className: "mt-5 flex flex-col gap-3 sm:flex-row sm:items-center",
			children: [
				/* @__PURE__ */ _jsxDEV("p", {
					className: "text-xs text-mist",
					children: [
						"Showing 1 â ",
						filtered.length,
						" of ",
						filtered.length,
						" filtered"
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 238,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV(SearchInput, {
					className: "sm:ml-auto sm:max-w-md sm:flex-1",
					value: query,
					onChange: setQuery,
					placeholder: "Search by name or UDIDâ¦"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 241,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "flex rounded-xl border border-line bg-ink-3 p-1",
					children: [/* @__PURE__ */ _jsxDEV("button", {
						type: "button",
						"aria-label": "Grid view",
						className: cn("rounded-lg p-1.5", view === "grid" ? "bg-ink-4 text-signal" : "text-mist"),
						onClick: () => setView("grid"),
						children: /* @__PURE__ */ _jsxDEV(LayoutGrid, { className: "size-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 254,
							columnNumber: 13
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 248,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV("button", {
						type: "button",
						"aria-label": "List view",
						className: cn("rounded-lg p-1.5", view === "list" ? "bg-ink-4 text-signal" : "text-mist"),
						onClick: () => setView("list"),
						children: /* @__PURE__ */ _jsxDEV(List, { className: "size-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 262,
							columnNumber: 13
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 256,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 247,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 237,
			columnNumber: 7
		}, this),
		location === "cloud" ? /* @__PURE__ */ _jsxDEV("div", {
			className: "mt-8 rounded-2xl border border-dashed border-line bg-ink-2/50 px-6 py-16 text-center",
			children: [
				/* @__PURE__ */ _jsxDEV("p", {
					className: "text-lg font-medium",
					children: "No cloud providers connected"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 269,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV("p", {
					className: "mt-2 text-sm text-mist",
					children: "Connect BrowserStack, Sauce Labs, or a private cloud under Admin â Cloud Providers."
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 270,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV(Button, {
					className: "mt-5",
					variant: "secondary",
					onClick: () => flash("Open Cloud Providers from the sidebar"),
					children: "Configure providers"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 271,
					columnNumber: 11
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 268,
			columnNumber: 9
		}, this) : filtered.length === 0 ? /* @__PURE__ */ _jsxDEV("div", {
			className: "mt-8 rounded-2xl border border-dashed border-line px-6 py-16 text-center text-sm text-mist",
			children: "No devices match your filters."
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 276,
			columnNumber: 9
		}, this) : view === "grid" ? /* @__PURE__ */ _jsxDEV("div", {
			className: "mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
			children: filtered.map((device) => /* @__PURE__ */ _jsxDEV(DeviceCard, {
				device,
				onUse,
				onView,
				onBlock
			}, device.id, false, {
				fileName: _jsxFileName,
				lineNumber: 282,
				columnNumber: 13
			}, this))
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 280,
			columnNumber: 9
		}, this) : /* @__PURE__ */ _jsxDEV("div", {
			className: "mt-5 overflow-hidden rounded-2xl border border-line",
			children: /* @__PURE__ */ _jsxDEV("table", {
				className: "w-full text-left text-sm",
				children: [/* @__PURE__ */ _jsxDEV("thead", {
					className: "bg-ink-3 text-[11px] uppercase tracking-wider text-mist",
					children: /* @__PURE__ */ _jsxDEV("tr", { children: [
						/* @__PURE__ */ _jsxDEV("th", {
							className: "px-4 py-3 font-semibold",
							children: "Device"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 290,
							columnNumber: 17
						}, this),
						/* @__PURE__ */ _jsxDEV("th", {
							className: "px-4 py-3 font-semibold",
							children: "Status"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 291,
							columnNumber: 17
						}, this),
						/* @__PURE__ */ _jsxDEV("th", {
							className: "px-4 py-3 font-semibold",
							children: "Node"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 292,
							columnNumber: 17
						}, this),
						/* @__PURE__ */ _jsxDEV("th", {
							className: "px-4 py-3 font-semibold",
							children: "Usage"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 293,
							columnNumber: 17
						}, this),
						/* @__PURE__ */ _jsxDEV("th", {
							className: "px-4 py-3 font-semibold",
							children: "UDID"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 294,
							columnNumber: 17
						}, this),
						/* @__PURE__ */ _jsxDEV("th", { className: "px-4 py-3 font-semibold" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 295,
							columnNumber: 17
						}, this)
					] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 289,
						columnNumber: 15
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 288,
					columnNumber: 13
				}, this), /* @__PURE__ */ _jsxDEV("tbody", {
					className: "divide-y divide-line",
					children: filtered.map((device) => {
						const Icon = device.platform === "ios" ? Apple : Smartphone;
						return /* @__PURE__ */ _jsxDEV("tr", {
							className: "bg-ink-2/40 hover:bg-ink-3/50",
							children: [
								/* @__PURE__ */ _jsxDEV("td", {
									className: "px-4 py-3",
									children: /* @__PURE__ */ _jsxDEV("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ _jsxDEV(Icon, { className: "size-4 text-mist" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 305,
											columnNumber: 25
										}, this), /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
											className: "font-medium",
											children: device.name
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 307,
											columnNumber: 27
										}, this), /* @__PURE__ */ _jsxDEV("p", {
											className: "text-xs text-mist",
											children: [
												device.platform,
												" Â· v",
												device.osVersion
											]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 308,
											columnNumber: 27
										}, this)] }, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 306,
											columnNumber: 25
										}, this)]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 304,
										columnNumber: 23
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 303,
									columnNumber: 21
								}, this),
								/* @__PURE__ */ _jsxDEV("td", {
									className: "px-4 py-3",
									children: [
										/* @__PURE__ */ _jsxDEV(DeviceStatusBadge, { status: device.status }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 315,
											columnNumber: 23
										}, this),
										device.status === "busy" && device.busyBy ? /* @__PURE__ */ _jsxDEV("p", {
											className: `mt-1 text-[11px] ${device.busyMine ? "text-pass" : "text-warn"}`,
											children: device.busyMine ? "your session" : device.busyBy
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 317,
											columnNumber: 25
										}, this) : null,
										device.note ? /* @__PURE__ */ _jsxDEV("p", {
											className: "mt-1 text-[11px] text-warn",
											children: device.note
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 321,
											columnNumber: 38
										}, this) : null
									]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 314,
									columnNumber: 21
								}, this),
								/* @__PURE__ */ _jsxDEV("td", {
									className: "px-4 py-3 text-fog",
									children: device.node
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 323,
									columnNumber: 21
								}, this),
								/* @__PURE__ */ _jsxDEV("td", {
									className: "px-4 py-3 tabular-nums text-fog",
									children: formatDuration(device.usageSeconds)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 324,
									columnNumber: 21
								}, this),
								/* @__PURE__ */ _jsxDEV("td", {
									className: "px-4 py-3 font-mono text-xs text-mist",
									children: device.udid
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 325,
									columnNumber: 21
								}, this),
								/* @__PURE__ */ _jsxDEV("td", {
									className: "px-4 py-3 text-right",
									children: /* @__PURE__ */ _jsxDEV("div", {
										className: "flex justify-end gap-2",
										children: [device.sessionKind === "automation" || device.status === "busy" && !device.busyMine && device.sessionId ? /* @__PURE__ */ _jsxDEV(Button, {
											size: "sm",
											variant: "secondary",
											onClick: () => onView(device),
											children: "View"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 329,
											columnNumber: 27
										}, this) : null, /* @__PURE__ */ _jsxDEV(Button, {
											size: "sm",
											disabled: device.sessionKind === "automation" || device.status === "busy" && !device.busyMine,
											title: device.sessionKind === "automation" ? "Automation in progress" : device.status === "busy" && !device.busyMine ? `${device.busyBy} is using this device` : undefined,
											onClick: () => onUse(device),
											children: device.busyMine && device.sessionKind !== "automation" ? "Resume" : "Start app"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 333,
											columnNumber: 25
										}, this)]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 327,
										columnNumber: 23
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 326,
									columnNumber: 21
								}, this)
							]
						}, device.id, true, {
							fileName: _jsxFileName,
							lineNumber: 302,
							columnNumber: 19
						}, this);
					})
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 298,
					columnNumber: 13
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 287,
				columnNumber: 11
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 286,
			columnNumber: 9
		}, this),
		toast ? /* @__PURE__ */ _jsxDEV("div", {
			className: "fixed bottom-6 right-6 z-50 rounded-xl border border-signal/40 bg-ink-3 px-4 py-3 text-sm text-snow shadow-xl animate-fade-up",
			children: toast
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 361,
			columnNumber: 9
		}, this) : null
	] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 169,
		columnNumber: 5
	}, this);
}
_s(DevicesPage, "hUtu+5aV6orVCY3g9GAFPaX8TgI=", false, function() {
	return [useNavigate];
});
_c = DevicesPage;
function Tab({ active, onClick, label }) {
	return /* @__PURE__ */ _jsxDEV("button", {
		type: "button",
		onClick,
		className: cn("rounded-full border px-3 py-1.5 text-xs font-medium transition", active ? "border-signal/50 bg-signal/15 text-signal" : "border-line bg-ink-2 text-mist hover:text-snow"),
		children: label
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 371,
		columnNumber: 5
	}, this);
}
_c2 = Tab;
var _c, _c2;
$RefreshReg$(_c, "DevicesPage");
$RefreshReg$(_c2, "Tab");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/pages/DevicesPage.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/sameershaikh_uts/Projects/xpedite-for-mac/relay-console/src/pages/DevicesPage.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/sameershaikh_uts/Projects/xpedite-for-mac/relay-console/src/pages/DevicesPage.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/sameershaikh_uts/Projects/xpedite-for-mac/relay-console/src/pages/DevicesPage.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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QUNIOzs7OztPQUNGO1NBbERLLE9BQU87Ozs7YUFrRFo7S0FFUixDQUFDO0lBQ0k7Ozs7WUFDRjs7Ozs7O0VBQ0o7Ozs7O0VBR04sUUFDQyx3QkFBQyxPQUFEO0dBQUssV0FBVTthQUNaO0VBQ0U7Ozs7YUFDSDtDQUNEOzs7OztBQUVUOzs7OztBQUVBLFNBQVMsSUFBSSxFQUFFLFFBQVEsU0FBUyxTQUFrRTtDQUNoRyxPQUNFLHdCQUFDLFVBQUQ7RUFDRSxNQUFLO0VBQ0k7RUFDVCxXQUFXLEdBQ1Qsa0VBQ0EsU0FBUyw4Q0FBOEMsZ0RBQ3pEO1lBRUM7Q0FDSzs7Ozs7QUFFWiIsIm5hbWVzIjpbXSwic291cmNlcyI6WyJEZXZpY2VzUGFnZS50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlTmF2aWdhdGUgfSBmcm9tICdyZWFjdC1yb3V0ZXItZG9tJ1xuaW1wb3J0IHsgRGV2aWNlQ2FyZCB9IGZyb20gJ0AvY29tcG9uZW50cy9kZXZpY2VzL0RldmljZUNhcmQnXG5pbXBvcnQgeyBFbSwgUGFnZUhlYWRlciB9IGZyb20gJ0AvY29tcG9uZW50cy9sYXlvdXQvUGFnZUhlYWRlcidcbmltcG9ydCB7IEJ1dHRvbiB9IGZyb20gJ0AvY29tcG9uZW50cy91aS9CdXR0b24nXG5pbXBvcnQgeyBTZWFyY2hJbnB1dCB9IGZyb20gJ0AvY29tcG9uZW50cy91aS9TZWFyY2hJbnB1dCdcbmltcG9ydCB7IFN0YXRDYXJkIH0gZnJvbSAnQC9jb21wb25lbnRzL3VpL1N0YXRDYXJkJ1xuaW1wb3J0IHsgYXBwcyB9IGZyb20gJ0AvZGF0YS9tb2NrJ1xuaW1wb3J0IHR5cGUgeyBEZXZpY2UsIERldmljZUtpbmQsIERldmljZVBsYXRmb3JtLCBEZXZpY2VTdGF0dXMgfSBmcm9tICdAL3R5cGVzJ1xuaW1wb3J0IHsgTGF5b3V0R3JpZCwgTGlzdCB9IGZyb20gJ2x1Y2lkZS1yZWFjdCdcbmltcG9ydCB7IGNuIH0gZnJvbSAnQC9saWIvdXRpbHMnXG5pbXBvcnQgeyBmb3JtYXREdXJhdGlvbiB9IGZyb20gJ0AvbGliL3V0aWxzJ1xuaW1wb3J0IHsgRGV2aWNlU3RhdHVzQmFkZ2UgfSBmcm9tICdAL2NvbXBvbmVudHMvdWkvU3RhdHVzQmFkZ2VzJ1xuaW1wb3J0IHsgQXBwbGUsIFNtYXJ0cGhvbmUgfSBmcm9tICdsdWNpZGUtcmVhY3QnXG5pbXBvcnQgeyBnZXRIZWFsdGgsIEhVQiwgbGlzdEh1YkRldmljZXMgfSBmcm9tICdAL2xpYi9odWInXG5cbnR5cGUgU3RhdHVzRmlsdGVyID0gJ2FsbCcgfCBEZXZpY2VTdGF0dXNcbnR5cGUgUGxhdGZvcm1GaWx0ZXIgPSAnYWxsJyB8IERldmljZVBsYXRmb3JtXG50eXBlIEtpbmRGaWx0ZXIgPSAnYWxsJyB8IERldmljZUtpbmRcbnR5cGUgTG9jYXRpb25UYWIgPSAnbG9jYWwnIHwgJ2Nsb3VkJ1xuXG5leHBvcnQgZnVuY3Rpb24gRGV2aWNlc1BhZ2UoKSB7XG4gIGNvbnN0IG5hdmlnYXRlID0gdXNlTmF2aWdhdGUoKVxuICBjb25zdCBbZGV2aWNlcywgc2V0RGV2aWNlc10gPSB1c2VTdGF0ZTxEZXZpY2VbXT4oW10pXG4gIGNvbnN0IFtodWJPbmxpbmUsIHNldEh1Yk9ubGluZV0gPSB1c2VTdGF0ZTxib29sZWFuIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW2FwcGl1bU9ubGluZSwgc2V0QXBwaXVtT25saW5lXSA9IHVzZVN0YXRlKGZhbHNlKVxuICBjb25zdCBbaHViRXJyb3IsIHNldEh1YkVycm9yXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG4gIGNvbnN0IFtsb2NhdGlvbiwgc2V0TG9jYXRpb25dID0gdXNlU3RhdGU8TG9jYXRpb25UYWI+KCdsb2NhbCcpXG4gIGNvbnN0IFtzdGF0dXMsIHNldFN0YXR1c10gPSB1c2VTdGF0ZTxTdGF0dXNGaWx0ZXI+KCdhbGwnKVxuICBjb25zdCBbcGxhdGZvcm0sIHNldFBsYXRmb3JtXSA9IHVzZVN0YXRlPFBsYXRmb3JtRmlsdGVyPignYWxsJylcbiAgY29uc3QgW2tpbmQsIHNldEtpbmRdID0gdXNlU3RhdGU8S2luZEZpbHRlcj4oJ2FsbCcpXG4gIGNvbnN0IFtxdWVyeSwgc2V0UXVlcnldID0gdXNlU3RhdGUoJycpXG4gIGNvbnN0IFt2aWV3LCBzZXRWaWV3XSA9IHVzZVN0YXRlPCdncmlkJyB8ICdsaXN0Jz4oJ2dyaWQnKVxuICBjb25zdCBbdG9hc3QsIHNldFRvYXN0XSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG5cbiAgYXN5bmMgZnVuY3Rpb24gcmVmcmVzaERldmljZXMoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGhlYWx0aCA9IGF3YWl0IGdldEhlYWx0aCgpXG4gICAgICBzZXRIdWJPbmxpbmUodHJ1ZSlcbiAgICAgIHNldEFwcGl1bU9ubGluZShoZWFsdGguYXBwaXVtKVxuICAgICAgY29uc3QgeyBkZXZpY2VzOiBsaXN0IH0gPSBhd2FpdCBsaXN0SHViRGV2aWNlcygpXG4gICAgICBzZXREZXZpY2VzKFxuICAgICAgICBsaXN0Lm1hcCgoZCkgPT4gKHtcbiAgICAgICAgICBpZDogZC51ZGlkLFxuICAgICAgICAgIG5hbWU6IGQubmFtZSxcbiAgICAgICAgICBwbGF0Zm9ybTogKGQucGxhdGZvcm0gPT09ICdpb3MnID8gJ2lvcycgOiAnYW5kcm9pZCcpIGFzIERldmljZVBsYXRmb3JtLFxuICAgICAgICAgIG9zVmVyc2lvbjogZC5vc1ZlcnNpb24sXG4gICAgICAgICAgdWRpZDogZC51ZGlkLFxuICAgICAgICAgIG5vZGU6IGQubm9kZSxcbiAgICAgICAgICBzdGF0dXM6IChkLnN0YXR1cyA9PT0gJ3JlYWR5JyA/ICdyZWFkeScgOiBkLnN0YXR1cyA9PT0gJ29mZmxpbmUnID8gJ29mZmxpbmUnIDogJ2J1c3knKSBhcyBEZXZpY2VTdGF0dXMsXG4gICAgICAgICAga2luZDogZC5raW5kID09PSAndmlydHVhbCcgPyAndmlydHVhbCcgOiAncmVhbCcsXG4gICAgICAgICAgdXNhZ2VTZWNvbmRzOiBkLnVzYWdlU2Vjb25kcyB8fCAwLFxuICAgICAgICAgIG1vZGVsOiBkLm1vZGVsIHx8IGQudWRpZCxcbiAgICAgICAgICBsb2NhdGlvbjogJ2xvY2FsJyxcbiAgICAgICAgICBidXN5Qnk6IGQuYnVzeUJ5LFxuICAgICAgICAgIGJ1c3lTaW5jZTogZC5idXN5U2luY2UsXG4gICAgICAgICAgYnVzeU1pbmU6IGQuYnVzeU1pbmUsXG4gICAgICAgICAgc2Vzc2lvbklkOiBkLnNlc3Npb25JZCxcbiAgICAgICAgICBzZXNzaW9uS2luZDogZC5zZXNzaW9uS2luZCxcbiAgICAgICAgICB0ZXN0TmFtZTogZC50ZXN0TmFtZSxcbiAgICAgICAgICBhbGxvd1ZpZXdlckludGVyYWN0OiBkLmFsbG93Vmlld2VySW50ZXJhY3QsXG4gICAgICAgICAgbm90ZTogZC5ub3RlLFxuICAgICAgICB9KSksXG4gICAgICApXG4gICAgICBzZXRIdWJFcnJvcihudWxsKVxuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgc2V0SHViT25saW5lKGZhbHNlKVxuICAgICAgc2V0QXBwaXVtT25saW5lKGZhbHNlKVxuICAgICAgc2V0RGV2aWNlcyhbXSlcbiAgICAgIHNldEh1YkVycm9yKGUubWVzc2FnZSB8fCAnSHViIHVucmVhY2hhYmxlJylcbiAgICB9XG4gIH1cblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHJlZnJlc2hEZXZpY2VzKClcbiAgICBjb25zdCB0ID0gd2luZG93LnNldEludGVydmFsKHJlZnJlc2hEZXZpY2VzLCA1MDAwKVxuICAgIHJldHVybiAoKSA9PiB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0KVxuICB9LCBbXSlcblxuICBjb25zdCBzY29wZWQgPSB1c2VNZW1vKFxuICAgICgpID0+IGRldmljZXMuZmlsdGVyKChkKSA9PiBkLmxvY2F0aW9uID09PSBsb2NhdGlvbiksXG4gICAgW2RldmljZXMsIGxvY2F0aW9uXSxcbiAgKVxuXG4gIGNvbnN0IHN0YXRzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgdG90YWwgPSBzY29wZWQubGVuZ3RoXG4gICAgY29uc3QgcmVhZHkgPSBzY29wZWQuZmlsdGVyKChkKSA9PiBkLnN0YXR1cyA9PT0gJ3JlYWR5JykubGVuZ3RoXG4gICAgY29uc3QgYnVzeSA9IHNjb3BlZC5maWx0ZXIoKGQpID0+IGQuc3RhdHVzID09PSAnYnVzeScpLmxlbmd0aFxuICAgIGNvbnN0IG9mZmxpbmUgPSBzY29wZWQuZmlsdGVyKChkKSA9PiBkLnN0YXR1cyA9PT0gJ29mZmxpbmUnKS5sZW5ndGhcbiAgICBjb25zdCBpb3MgPSBzY29wZWQuZmlsdGVyKChkKSA9PiBkLnBsYXRmb3JtID09PSAnaW9zJykubGVuZ3RoXG4gICAgY29uc3QgYW5kcm9pZCA9IHNjb3BlZC5maWx0ZXIoKGQpID0+IGQucGxhdGZvcm0gPT09ICdhbmRyb2lkJykubGVuZ3RoXG4gICAgY29uc3QgcmVhbCA9IHNjb3BlZC5maWx0ZXIoKGQpID0+IGQua2luZCA9PT0gJ3JlYWwnKS5sZW5ndGhcbiAgICBjb25zdCB2aXJ0dWFsID0gc2NvcGVkLmZpbHRlcigoZCkgPT4gZC5raW5kID09PSAndmlydHVhbCcpLmxlbmd0aFxuICAgIHJldHVybiB7IHRvdGFsLCByZWFkeSwgYnVzeSwgb2ZmbGluZSwgaW9zLCBhbmRyb2lkLCByZWFsLCB2aXJ0dWFsIH1cbiAgfSwgW3Njb3BlZF0pXG5cbiAgY29uc3QgZmlsdGVyZWQgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBjb25zdCBxID0gcXVlcnkudHJpbSgpLnRvTG93ZXJDYXNlKClcbiAgICByZXR1cm4gc2NvcGVkLmZpbHRlcigoZCkgPT4ge1xuICAgICAgaWYgKHN0YXR1cyAhPT0gJ2FsbCcgJiYgZC5zdGF0dXMgIT09IHN0YXR1cykgcmV0dXJuIGZhbHNlXG4gICAgICBpZiAocGxhdGZvcm0gIT09ICdhbGwnICYmIGQucGxhdGZvcm0gIT09IHBsYXRmb3JtKSByZXR1cm4gZmFsc2VcbiAgICAgIGlmIChraW5kICE9PSAnYWxsJyAmJiBkLmtpbmQgIT09IGtpbmQpIHJldHVybiBmYWxzZVxuICAgICAgaWYgKCFxKSByZXR1cm4gdHJ1ZVxuICAgICAgcmV0dXJuIChcbiAgICAgICAgZC5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocSkgfHxcbiAgICAgICAgZC51ZGlkLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocSkgfHxcbiAgICAgICAgZC5tb2RlbC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHEpXG4gICAgICApXG4gICAgfSlcbiAgfSwgW3Njb3BlZCwgc3RhdHVzLCBwbGF0Zm9ybSwga2luZCwgcXVlcnldKVxuXG4gIGZ1bmN0aW9uIGZsYXNoKG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHNldFRvYXN0KG1lc3NhZ2UpXG4gICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gc2V0VG9hc3QobnVsbCksIDIyMDApXG4gIH1cblxuICBmdW5jdGlvbiBvblVzZShkZXZpY2U6IERldmljZSkge1xuICAgIGlmIChkZXZpY2Uuc3RhdHVzID09PSAnb2ZmbGluZScgfHwgZGV2aWNlLnN0YXR1cyA9PT0gJ2Jsb2NrZWQnKSB7XG4gICAgICBmbGFzaChkZXZpY2Uubm90ZSA/IGAke2RldmljZS5uYW1lfTogJHtkZXZpY2Uubm90ZX1gIDogYCR7ZGV2aWNlLm5hbWV9IGlzIG5vdCBhdmFpbGFibGUuYClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoZGV2aWNlLnNlc3Npb25LaW5kID09PSAnYXV0b21hdGlvbicpIHtcbiAgICAgIGZsYXNoKGAke2RldmljZS5uYW1lfSBpcyBydW5uaW5nIGF1dG9tYXRpb24uIFVzZSBWaWV3IEF1dG9tYXRpb24uYClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoZGV2aWNlLnN0YXR1cyA9PT0gJ2J1c3knICYmICFkZXZpY2UuYnVzeU1pbmUpIHtcbiAgICAgIGZsYXNoKGAke2RldmljZS5uYW1lfSBpcyBpbiB1c2UgYnkgJHtkZXZpY2UuYnVzeUJ5IHx8ICdhbm90aGVyIHVzZXInfS5gKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmICghaHViT25saW5lKSB7XG4gICAgICBmbGFzaCgnTG9jYWwgaHViIGlzIG9mZmxpbmUuIFN0YXJ0IHJlbGF5LWh1YiBmaXJzdC4nKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IGRlZmF1bHRBcHAgPVxuICAgICAgZGV2aWNlLnBsYXRmb3JtID09PSAnaW9zJ1xuICAgICAgICA/IGFwcHMuZmluZCgoYSkgPT4gYS5wbGF0Zm9ybSA9PT0gJ2lvcycgJiYgYS5wYWNrYWdlSWQgPT09ICdjb20uYXBwbGUubW9iaWxlc2FmYXJpJykgPz9cbiAgICAgICAgICBhcHBzLmZpbmQoKGEpID0+IGEucGxhdGZvcm0gPT09ICdpb3MnKVxuICAgICAgICA6IGFwcHMuZmluZCgoYSkgPT4gYS5wbGF0Zm9ybSA9PT0gJ2FuZHJvaWQnICYmIGEucGFja2FnZUlkID09PSAnY29tLmFuZHJvaWQuY2hyb21lJykgPz9cbiAgICAgICAgICBhcHBzLmZpbmQoKGEpID0+IGEucGxhdGZvcm0gPT09ICdhbmRyb2lkJylcbiAgICBmbGFzaChgT3BlbmluZyByZWFsIHNlc3Npb24gb24gJHtkZXZpY2UubmFtZX3igKZgKVxuICAgIG5hdmlnYXRlKFxuICAgICAgYC9kZXZpY2VzLyR7ZW5jb2RlVVJJQ29tcG9uZW50KGRldmljZS51ZGlkKX0vc2Vzc2lvbj9wbGF0Zm9ybT0ke2RldmljZS5wbGF0Zm9ybX0ke2RlZmF1bHRBcHAgPyBgJmFwcD0ke2RlZmF1bHRBcHAuaWR9YCA6ICcnfWAsXG4gICAgKVxuICB9XG5cbiAgZnVuY3Rpb24gb25WaWV3KGRldmljZTogRGV2aWNlKSB7XG4gICAgaWYgKCFkZXZpY2Uuc2Vzc2lvbklkKSB7XG4gICAgICBmbGFzaChgJHtkZXZpY2UubmFtZX0gaGFzIG5vIGFjdGl2ZSBzZXNzaW9uIHRvIHZpZXcuYClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBmbGFzaChgT3BlbmluZyBsaXZlIHZpZXcgZm9yICR7ZGV2aWNlLm5hbWV94oCmYClcbiAgICBuYXZpZ2F0ZShcbiAgICAgIGAvZGV2aWNlcy8ke2VuY29kZVVSSUNvbXBvbmVudChkZXZpY2UudWRpZCl9L3Nlc3Npb24/cGxhdGZvcm09JHtkZXZpY2UucGxhdGZvcm19JnZpZXc9MSZzZXNzaW9uSWQ9JHtlbmNvZGVVUklDb21wb25lbnQoZGV2aWNlLnNlc3Npb25JZCl9YCxcbiAgICApXG4gIH1cblxuICBmdW5jdGlvbiBvbkJsb2NrKGRldmljZTogRGV2aWNlKSB7XG4gICAgZmxhc2goYEJsb2NrIGlzIGxvY2FsLW9ubHkgZm9yICR7ZGV2aWNlLm5hbWV9IChub3Qgc2VudCB0byBkZXZpY2UpYClcbiAgICBzZXREZXZpY2VzKChwcmV2KSA9PlxuICAgICAgcHJldi5tYXAoKGQpID0+XG4gICAgICAgIGQuaWQgPT09IGRldmljZS5pZFxuICAgICAgICAgID8geyAuLi5kLCBzdGF0dXM6IGQuc3RhdHVzID09PSAnYmxvY2tlZCcgPyAncmVhZHknIDogKCdibG9ja2VkJyBhcyBjb25zdCkgfVxuICAgICAgICAgIDogZCxcbiAgICAgICksXG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJtYi00IGZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICA8VGFiXG4gICAgICAgICAgYWN0aXZlPXtsb2NhdGlvbiA9PT0gJ2xvY2FsJ31cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRMb2NhdGlvbignbG9jYWwnKX1cbiAgICAgICAgICBsYWJlbD17YExvY2FsIGRldmljZXMgJHtzdGF0cy50b3RhbH1gfVxuICAgICAgICAvPlxuICAgICAgICA8VGFiIGFjdGl2ZT17bG9jYXRpb24gPT09ICdjbG91ZCd9IG9uQ2xpY2s9eygpID0+IHNldExvY2F0aW9uKCdjbG91ZCcpfSBsYWJlbD1cIkNsb3VkIGRldmljZXNcIiAvPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1sLWF1dG8gZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIGNsYXNzTmFtZT17Y24oXG4gICAgICAgICAgICAgICdpbmxpbmUtZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSByb3VuZGVkLWZ1bGwgYm9yZGVyIHB4LTMgcHktMSB0ZXh0LXhzJyxcbiAgICAgICAgICAgICAgaHViT25saW5lID8gJ2JvcmRlci1wYXNzLzQwIHRleHQtcGFzcycgOiAnYm9yZGVyLWRhbmdlci80MCB0ZXh0LWRhbmdlcicsXG4gICAgICAgICAgICApfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17Y24oJ3NpemUtMS41IHJvdW5kZWQtZnVsbCcsIGh1Yk9ubGluZSA/ICdiZy1wYXNzJyA6ICdiZy1kYW5nZXInKX0gLz5cbiAgICAgICAgICAgIEh1YiB7aHViT25saW5lID8gJ29ubGluZScgOiAnb2ZmbGluZSd9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBjbGFzc05hbWU9e2NuKFxuICAgICAgICAgICAgICAnaW5saW5lLWZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgcm91bmRlZC1mdWxsIGJvcmRlciBweC0zIHB5LTEgdGV4dC14cycsXG4gICAgICAgICAgICAgIGFwcGl1bU9ubGluZSA/ICdib3JkZXItcGFzcy80MCB0ZXh0LXBhc3MnIDogJ2JvcmRlci13YXJuLzQwIHRleHQtd2FybicsXG4gICAgICAgICAgICApfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIEFwcGl1bSB7YXBwaXVtT25saW5lID8gJ3JlYWR5JyA6ICdkb3duJ31cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPEJ1dHRvbiBzaXplPVwic21cIiB2YXJpYW50PVwic2Vjb25kYXJ5XCIgb25DbGljaz17cmVmcmVzaERldmljZXN9PlxuICAgICAgICAgICAgUmVmcmVzaCBkZXZpY2VzXG4gICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHtodWJFcnJvciA/IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtYi00IHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci13YXJuLzQwIGJnLXdhcm4vMTAgcHgtNCBweS0zIHRleHQtc20gdGV4dC13YXJuXCI+XG4gICAgICAgICAgTG9jYWwgaHViIG5vdCByZWFjaGFibGUgKHtIVUJ9KToge2h1YkVycm9yfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtMSB0ZXh0LXhzIHRleHQtbWlzdFwiPlxuICAgICAgICAgICAgTWFjOiBydW4gPGNvZGUgY2xhc3NOYW1lPVwidGV4dC1mb2dcIj4uL3NjcmlwdHMvbWFjLXN0YXJ0LnNoPC9jb2RlPiBmcm9tIHRoZSBwcm9qZWN0IGZvbGRlciwgb3IgZG91YmxlLWNsaWNreycgJ31cbiAgICAgICAgICAgIDxjb2RlIGNsYXNzTmFtZT1cInRleHQtZm9nXCI+WHBlZGl0ZSBTdGFydC5hcHA8L2NvZGU+LiBUaGVuIHBsdWcgaW4gYSBwaG9uZSBvciBzdGFydCBhbiBlbXVsYXRvciBhbmQgY2xpY2sgUmVmcmVzaC5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApIDogbnVsbH1cblxuICAgICAgeyFodWJFcnJvciAmJiBkZXZpY2VzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtYi00IHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1saW5lIGJnLWluay0yLzcwIHB4LTQgcHktMyB0ZXh0LXNtIHRleHQtZm9nXCI+XG4gICAgICAgICAgTm8gZGV2aWNlcyBmb3VuZC4gQm9vdCBhbiBpT1MgU2ltdWxhdG9yIChvcGVuIFNpbXVsYXRvciBhcHApIG9yIGNvbm5lY3QgQW5kcm9pZCB2aWEgQURCLCB0aGVuIGNsaWNrIFJlZnJlc2ggZGV2aWNlcy5cbiAgICAgICAgPC9kaXY+XG4gICAgICApIDogbnVsbH1cblxuICAgICAgPFBhZ2VIZWFkZXJcbiAgICAgICAgZXllYnJvdz1cIkRldmljZSBmbGVldCDCtyByZWFsIEFwcGl1bVwiXG4gICAgICAgIHRpdGxlPXtcbiAgICAgICAgICA8PlxuICAgICAgICAgICAgRXZlcnkgZGV2aWNlLiA8RW0+T25lIGNvbnNvbGUuPC9FbT5cbiAgICAgICAgICA8Lz5cbiAgICAgICAgfVxuICAgICAgLz5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0yIGdhcC0yIHNtOmdyaWQtY29scy00IHhsOmdyaWQtY29scy04XCI+XG4gICAgICAgIDxTdGF0Q2FyZCBsYWJlbD1cIlRvdGFsXCIgdmFsdWU9e3N0YXRzLnRvdGFsfSBhY3RpdmU9e3N0YXR1cyA9PT0gJ2FsbCcgJiYgcGxhdGZvcm0gPT09ICdhbGwnICYmIGtpbmQgPT09ICdhbGwnfSBvbkNsaWNrPXsoKSA9PiB7IHNldFN0YXR1cygnYWxsJyk7IHNldFBsYXRmb3JtKCdhbGwnKTsgc2V0S2luZCgnYWxsJykgfX0gLz5cbiAgICAgICAgPFN0YXRDYXJkIGxhYmVsPVwiUmVhZHlcIiB2YWx1ZT17c3RhdHMucmVhZHl9IHRvbmU9XCJwYXNzXCIgYWN0aXZlPXtzdGF0dXMgPT09ICdyZWFkeSd9IG9uQ2xpY2s9eygpID0+IHNldFN0YXR1cyhzdGF0dXMgPT09ICdyZWFkeScgPyAnYWxsJyA6ICdyZWFkeScpfSAvPlxuICAgICAgICA8U3RhdENhcmQgbGFiZWw9XCJCdXN5XCIgdmFsdWU9e3N0YXRzLmJ1c3l9IHRvbmU9XCJ3YXJuXCIgYWN0aXZlPXtzdGF0dXMgPT09ICdidXN5J30gb25DbGljaz17KCkgPT4gc2V0U3RhdHVzKHN0YXR1cyA9PT0gJ2J1c3knID8gJ2FsbCcgOiAnYnVzeScpfSAvPlxuICAgICAgICA8U3RhdENhcmQgbGFiZWw9XCJPZmZsaW5lXCIgdmFsdWU9e3N0YXRzLm9mZmxpbmV9IHRvbmU9XCJkYW5nZXJcIiBhY3RpdmU9e3N0YXR1cyA9PT0gJ29mZmxpbmUnfSBvbkNsaWNrPXsoKSA9PiBzZXRTdGF0dXMoc3RhdHVzID09PSAnb2ZmbGluZScgPyAnYWxsJyA6ICdvZmZsaW5lJyl9IC8+XG4gICAgICAgIDxTdGF0Q2FyZCBsYWJlbD1cImlPU1wiIHZhbHVlPXtzdGF0cy5pb3N9IGFjdGl2ZT17cGxhdGZvcm0gPT09ICdpb3MnfSBvbkNsaWNrPXsoKSA9PiBzZXRQbGF0Zm9ybShwbGF0Zm9ybSA9PT0gJ2lvcycgPyAnYWxsJyA6ICdpb3MnKX0gLz5cbiAgICAgICAgPFN0YXRDYXJkIGxhYmVsPVwiQW5kcm9pZFwiIHZhbHVlPXtzdGF0cy5hbmRyb2lkfSBhY3RpdmU9e3BsYXRmb3JtID09PSAnYW5kcm9pZCd9IG9uQ2xpY2s9eygpID0+IHNldFBsYXRmb3JtKHBsYXRmb3JtID09PSAnYW5kcm9pZCcgPyAnYWxsJyA6ICdhbmRyb2lkJyl9IC8+XG4gICAgICAgIDxTdGF0Q2FyZCBsYWJlbD1cIlJlYWxcIiB2YWx1ZT17c3RhdHMucmVhbH0gYWN0aXZlPXtraW5kID09PSAncmVhbCd9IG9uQ2xpY2s9eygpID0+IHNldEtpbmQoa2luZCA9PT0gJ3JlYWwnID8gJ2FsbCcgOiAncmVhbCcpfSAvPlxuICAgICAgICA8U3RhdENhcmQgbGFiZWw9XCJWaXJ0dWFsXCIgdmFsdWU9e3N0YXRzLnZpcnR1YWx9IGFjdGl2ZT17a2luZCA9PT0gJ3ZpcnR1YWwnfSBvbkNsaWNrPXsoKSA9PiBzZXRLaW5kKGtpbmQgPT09ICd2aXJ0dWFsJyA/ICdhbGwnIDogJ3ZpcnR1YWwnKX0gLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTUgZmxleCBmbGV4LWNvbCBnYXAtMyBzbTpmbGV4LXJvdyBzbTppdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW1pc3RcIj5cbiAgICAgICAgICBTaG93aW5nIDEg4oCTIHtmaWx0ZXJlZC5sZW5ndGh9IG9mIHtmaWx0ZXJlZC5sZW5ndGh9IGZpbHRlcmVkXG4gICAgICAgIDwvcD5cbiAgICAgICAgPFNlYXJjaElucHV0XG4gICAgICAgICAgY2xhc3NOYW1lPVwic206bWwtYXV0byBzbTptYXgtdy1tZCBzbTpmbGV4LTFcIlxuICAgICAgICAgIHZhbHVlPXtxdWVyeX1cbiAgICAgICAgICBvbkNoYW5nZT17c2V0UXVlcnl9XG4gICAgICAgICAgcGxhY2Vob2xkZXI9XCJTZWFyY2ggYnkgbmFtZSBvciBVRElE4oCmXCJcbiAgICAgICAgLz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1saW5lIGJnLWluay0zIHAtMVwiPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgYXJpYS1sYWJlbD1cIkdyaWQgdmlld1wiXG4gICAgICAgICAgICBjbGFzc05hbWU9e2NuKCdyb3VuZGVkLWxnIHAtMS41JywgdmlldyA9PT0gJ2dyaWQnID8gJ2JnLWluay00IHRleHQtc2lnbmFsJyA6ICd0ZXh0LW1pc3QnKX1cbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFZpZXcoJ2dyaWQnKX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8TGF5b3V0R3JpZCBjbGFzc05hbWU9XCJzaXplLTRcIiAvPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgYXJpYS1sYWJlbD1cIkxpc3Qgdmlld1wiXG4gICAgICAgICAgICBjbGFzc05hbWU9e2NuKCdyb3VuZGVkLWxnIHAtMS41JywgdmlldyA9PT0gJ2xpc3QnID8gJ2JnLWluay00IHRleHQtc2lnbmFsJyA6ICd0ZXh0LW1pc3QnKX1cbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFZpZXcoJ2xpc3QnKX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8TGlzdCBjbGFzc05hbWU9XCJzaXplLTRcIiAvPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7bG9jYXRpb24gPT09ICdjbG91ZCcgPyAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtOCByb3VuZGVkLTJ4bCBib3JkZXIgYm9yZGVyLWRhc2hlZCBib3JkZXItbGluZSBiZy1pbmstMi81MCBweC02IHB5LTE2IHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LW1lZGl1bVwiPk5vIGNsb3VkIHByb3ZpZGVycyBjb25uZWN0ZWQ8L3A+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwibXQtMiB0ZXh0LXNtIHRleHQtbWlzdFwiPkNvbm5lY3QgQnJvd3NlclN0YWNrLCBTYXVjZSBMYWJzLCBvciBhIHByaXZhdGUgY2xvdWQgdW5kZXIgQWRtaW4g4oaSIENsb3VkIFByb3ZpZGVycy48L3A+XG4gICAgICAgICAgPEJ1dHRvbiBjbGFzc05hbWU9XCJtdC01XCIgdmFyaWFudD1cInNlY29uZGFyeVwiIG9uQ2xpY2s9eygpID0+IGZsYXNoKCdPcGVuIENsb3VkIFByb3ZpZGVycyBmcm9tIHRoZSBzaWRlYmFyJyl9PlxuICAgICAgICAgICAgQ29uZmlndXJlIHByb3ZpZGVyc1xuICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICkgOiBmaWx0ZXJlZC5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtOCByb3VuZGVkLTJ4bCBib3JkZXIgYm9yZGVyLWRhc2hlZCBib3JkZXItbGluZSBweC02IHB5LTE2IHRleHQtY2VudGVyIHRleHQtc20gdGV4dC1taXN0XCI+XG4gICAgICAgICAgTm8gZGV2aWNlcyBtYXRjaCB5b3VyIGZpbHRlcnMuXG4gICAgICAgIDwvZGl2PlxuICAgICAgKSA6IHZpZXcgPT09ICdncmlkJyA/IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtdC01IGdyaWQgZ2FwLTMgc206Z3JpZC1jb2xzLTIgeGw6Z3JpZC1jb2xzLTMgMnhsOmdyaWQtY29scy00XCI+XG4gICAgICAgICAge2ZpbHRlcmVkLm1hcCgoZGV2aWNlKSA9PiAoXG4gICAgICAgICAgICA8RGV2aWNlQ2FyZCBrZXk9e2RldmljZS5pZH0gZGV2aWNlPXtkZXZpY2V9IG9uVXNlPXtvblVzZX0gb25WaWV3PXtvblZpZXd9IG9uQmxvY2s9e29uQmxvY2t9IC8+XG4gICAgICAgICAgKSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgKSA6IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtdC01IG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLTJ4bCBib3JkZXIgYm9yZGVyLWxpbmVcIj5cbiAgICAgICAgICA8dGFibGUgY2xhc3NOYW1lPVwidy1mdWxsIHRleHQtbGVmdCB0ZXh0LXNtXCI+XG4gICAgICAgICAgICA8dGhlYWQgY2xhc3NOYW1lPVwiYmctaW5rLTMgdGV4dC1bMTFweF0gdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIHRleHQtbWlzdFwiPlxuICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB4LTQgcHktMyBmb250LXNlbWlib2xkXCI+RGV2aWNlPC90aD5cbiAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtNCBweS0zIGZvbnQtc2VtaWJvbGRcIj5TdGF0dXM8L3RoPlxuICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweC00IHB5LTMgZm9udC1zZW1pYm9sZFwiPk5vZGU8L3RoPlxuICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweC00IHB5LTMgZm9udC1zZW1pYm9sZFwiPlVzYWdlPC90aD5cbiAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtNCBweS0zIGZvbnQtc2VtaWJvbGRcIj5VRElEPC90aD5cbiAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtNCBweS0zIGZvbnQtc2VtaWJvbGRcIiAvPlxuICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgIDx0Ym9keSBjbGFzc05hbWU9XCJkaXZpZGUteSBkaXZpZGUtbGluZVwiPlxuICAgICAgICAgICAgICB7ZmlsdGVyZWQubWFwKChkZXZpY2UpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBJY29uID0gZGV2aWNlLnBsYXRmb3JtID09PSAnaW9zJyA/IEFwcGxlIDogU21hcnRwaG9uZVxuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICA8dHIga2V5PXtkZXZpY2UuaWR9IGNsYXNzTmFtZT1cImJnLWluay0yLzQwIGhvdmVyOmJnLWluay0zLzUwXCI+XG4gICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC00IHB5LTNcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8SWNvbiBjbGFzc05hbWU9XCJzaXplLTQgdGV4dC1taXN0XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e2RldmljZS5uYW1lfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW1pc3RcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZGV2aWNlLnBsYXRmb3JtfSDCtyB2e2RldmljZS5vc1ZlcnNpb259XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHgtNCBweS0zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPERldmljZVN0YXR1c0JhZGdlIHN0YXR1cz17ZGV2aWNlLnN0YXR1c30gLz5cbiAgICAgICAgICAgICAgICAgICAgICB7ZGV2aWNlLnN0YXR1cyA9PT0gJ2J1c3knICYmIGRldmljZS5idXN5QnkgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9e2BtdC0xIHRleHQtWzExcHhdICR7ZGV2aWNlLmJ1c3lNaW5lID8gJ3RleHQtcGFzcycgOiAndGV4dC13YXJuJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge2RldmljZS5idXN5TWluZSA/ICd5b3VyIHNlc3Npb24nIDogZGV2aWNlLmJ1c3lCeX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICApIDogbnVsbH1cbiAgICAgICAgICAgICAgICAgICAgICB7ZGV2aWNlLm5vdGUgPyA8cCBjbGFzc05hbWU9XCJtdC0xIHRleHQtWzExcHhdIHRleHQtd2FyblwiPntkZXZpY2Uubm90ZX08L3A+IDogbnVsbH1cbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTQgcHktMyB0ZXh0LWZvZ1wiPntkZXZpY2Uubm9kZX08L3RkPlxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHgtNCBweS0zIHRhYnVsYXItbnVtcyB0ZXh0LWZvZ1wiPntmb3JtYXREdXJhdGlvbihkZXZpY2UudXNhZ2VTZWNvbmRzKX08L3RkPlxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHgtNCBweS0zIGZvbnQtbW9ubyB0ZXh0LXhzIHRleHQtbWlzdFwiPntkZXZpY2UudWRpZH08L3RkPlxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHgtNCBweS0zIHRleHQtcmlnaHRcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1lbmQgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtkZXZpY2Uuc2Vzc2lvbktpbmQgPT09ICdhdXRvbWF0aW9uJyB8fCAoZGV2aWNlLnN0YXR1cyA9PT0gJ2J1c3knICYmICFkZXZpY2UuYnVzeU1pbmUgJiYgZGV2aWNlLnNlc3Npb25JZCkgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gc2l6ZT1cInNtXCIgdmFyaWFudD1cInNlY29uZGFyeVwiIG9uQ2xpY2s9eygpID0+IG9uVmlldyhkZXZpY2UpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBWaWV3XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKSA6IG51bGx9XG4gICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU9XCJzbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXZpY2Uuc2Vzc2lvbktpbmQgPT09ICdhdXRvbWF0aW9uJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChkZXZpY2Uuc3RhdHVzID09PSAnYnVzeScgJiYgIWRldmljZS5idXN5TWluZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWNlLnNlc3Npb25LaW5kID09PSAnYXV0b21hdGlvbidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ0F1dG9tYXRpb24gaW4gcHJvZ3Jlc3MnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGRldmljZS5zdGF0dXMgPT09ICdidXN5JyAmJiAhZGV2aWNlLmJ1c3lNaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gYCR7ZGV2aWNlLmJ1c3lCeX0gaXMgdXNpbmcgdGhpcyBkZXZpY2VgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gb25Vc2UoZGV2aWNlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge2RldmljZS5idXN5TWluZSAmJiBkZXZpY2Uuc2Vzc2lvbktpbmQgIT09ICdhdXRvbWF0aW9uJyA/ICdSZXN1bWUnIDogJ1N0YXJ0IGFwcCd9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7dG9hc3QgPyAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZml4ZWQgYm90dG9tLTYgcmlnaHQtNiB6LTUwIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zaWduYWwvNDAgYmctaW5rLTMgcHgtNCBweS0zIHRleHQtc20gdGV4dC1zbm93IHNoYWRvdy14bCBhbmltYXRlLWZhZGUtdXBcIj5cbiAgICAgICAgICB7dG9hc3R9XG4gICAgICAgIDwvZGl2PlxuICAgICAgKSA6IG51bGx9XG4gICAgPC9kaXY+XG4gIClcbn1cblxuZnVuY3Rpb24gVGFiKHsgYWN0aXZlLCBvbkNsaWNrLCBsYWJlbCB9OiB7IGFjdGl2ZTogYm9vbGVhbjsgb25DbGljazogKCkgPT4gdm9pZDsgbGFiZWw6IHN0cmluZyB9KSB7XG4gIHJldHVybiAoXG4gICAgPGJ1dHRvblxuICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICBvbkNsaWNrPXtvbkNsaWNrfVxuICAgICAgY2xhc3NOYW1lPXtjbihcbiAgICAgICAgJ3JvdW5kZWQtZnVsbCBib3JkZXIgcHgtMyBweS0xLjUgdGV4dC14cyBmb250LW1lZGl1bSB0cmFuc2l0aW9uJyxcbiAgICAgICAgYWN0aXZlID8gJ2JvcmRlci1zaWduYWwvNTAgYmctc2lnbmFsLzE1IHRleHQtc2lnbmFsJyA6ICdib3JkZXItbGluZSBiZy1pbmstMiB0ZXh0LW1pc3QgaG92ZXI6dGV4dC1zbm93JyxcbiAgICAgICl9XG4gICAgPlxuICAgICAge2xhYmVsfVxuICAgIDwvYnV0dG9uPlxuICApXG59XG4iXX0=

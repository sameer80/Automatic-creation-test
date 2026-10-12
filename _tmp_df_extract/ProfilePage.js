import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/ProfilePage.tsx");const useEffect = __vite__cjsImport0_react["useEffect"]; const useState = __vite__cjsImport0_react["useState"];const _jsxDEV = __vite__cjsImport6_react_jsxDevRuntime["jsxDEV"]; const _Fragment = __vite__cjsImport6_react_jsxDevRuntime["Fragment"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=26127ef3";
import { Em, PageHeader } from "/src/components/layout/PageHeader.tsx";
import { Button } from "/src/components/ui/Button.tsx";
import { useAuthStore } from "/src/store/auth.ts";
import { initials } from "/src/lib/utils.ts";
import { changePassword, createApiToken, deleteApiToken, listApiTokens, regenerateAccessKey, regenerateApiToken } from "/src/lib/hub.ts";
var _jsxFileName = "/Users/sameershaikh_uts/Projects/xpedite-for-mac/relay-console/src/pages/ProfilePage.tsx";
import __vite__cjsImport6_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=26127ef3";
var _s = $RefreshSig$();
export function ProfilePage() {
	_s();
	const user = useAuthStore((s) => s.user);
	const [accessKey, setAccessKey] = useState("");
	const [tokens, setTokens] = useState([]);
	const [tokenName, setTokenName] = useState("");
	const [expiresAt, setExpiresAt] = useState("");
	const [showAccessKey, setShowAccessKey] = useState(false);
	const [visibleTokens, setVisibleTokens] = useState(new Set());
	const [copied, setCopied] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	async function loadTokens() {
		const result = await listApiTokens();
		setAccessKey(result.accessKey);
		setTokens(result.tokens);
	}
	useEffect(() => {
		void loadTokens().catch((e) => setError(e.message));
	}, []);
	async function onCreateToken(event) {
		event.preventDefault();
		setError("");
		setMessage("");
		try {
			const result = await createApiToken(tokenName, expiresAt || undefined);
			setAccessKey(result.accessKey);
			setVisibleTokens((current) => new Set(current).add(result.token.id));
			setTokenName("");
			setExpiresAt("");
			await loadTokens();
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		}
	}
	async function copyValue(value, label) {
		await navigator.clipboard.writeText(value);
		setCopied(label);
		window.setTimeout(() => setCopied(""), 1500);
	}
	async function onRegenerateAccessKey() {
		if (!window.confirm("Regenerate access key? Existing integrations must be updated with the new key.")) return;
		try {
			const result = await regenerateAccessKey();
			setAccessKey(result.accessKey);
			setShowAccessKey(true);
			setMessage("Access key regenerated. Update all nodes and automation clients.");
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		}
	}
	async function onRegenerateToken(id) {
		if (!window.confirm("Regenerate this token? The old token will stop working immediately.")) return;
		try {
			await regenerateApiToken(id);
			setVisibleTokens((current) => new Set(current).add(id));
			setMessage("Token regenerated. Update integrations that used the old value.");
			await loadTokens();
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		}
	}
	async function onChangePassword(event) {
		event.preventDefault();
		setError("");
		setMessage("");
		try {
			await changePassword(currentPassword, newPassword);
			setCurrentPassword("");
			setNewPassword("");
			setMessage("Password changed successfully.");
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		}
	}
	return /* @__PURE__ */ _jsxDEV("div", { children: [
		/* @__PURE__ */ _jsxDEV(PageHeader, {
			eyebrow: "Profile",
			title: /* @__PURE__ */ _jsxDEV(_Fragment, { children: ["Account ", /* @__PURE__ */ _jsxDEV(Em, { children: "preferences." }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 106,
				columnNumber: 21
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 105,
				columnNumber: 11
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 102,
			columnNumber: 7
		}, this),
		error ? /* @__PURE__ */ _jsxDEV("p", {
			className: "mb-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger",
			children: error
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 111,
			columnNumber: 16
		}, this) : null,
		message ? /* @__PURE__ */ _jsxDEV("p", {
			className: "mb-4 rounded-xl border border-line bg-ink-3 p-3 text-sm text-fog",
			children: message
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 112,
			columnNumber: 18
		}, this) : null,
		/* @__PURE__ */ _jsxDEV("div", {
			className: "grid max-w-4xl gap-5 lg:grid-cols-2",
			children: [/* @__PURE__ */ _jsxDEV("section", {
				className: "rounded-2xl border border-line bg-ink-2/70 p-6",
				children: [/* @__PURE__ */ _jsxDEV("div", {
					className: "flex items-center gap-4",
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: "flex size-14 items-center justify-center rounded-2xl bg-ink-4 text-lg font-semibold text-signal",
						children: initials(user?.name ?? "AU")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 117,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV("div", { children: [
						/* @__PURE__ */ _jsxDEV("h2", {
							className: "text-xl font-semibold",
							children: user?.name
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 121,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("p", {
							className: "text-sm text-mist",
							children: user?.email
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 122,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("p", {
							className: "mt-1 text-xs capitalize text-fog",
							children: user?.role
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 123,
							columnNumber: 13
						}, this)
					] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 120,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 116,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV("form", {
					className: "mt-6 space-y-4",
					onSubmit: onChangePassword,
					children: [
						/* @__PURE__ */ _jsxDEV("h3", {
							className: "font-semibold",
							children: "Change password"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 128,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV(Field, {
							label: "Current password",
							value: currentPassword,
							onChange: setCurrentPassword,
							type: "password"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 129,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV(Field, {
							label: "New password (minimum 10 characters)",
							value: newPassword,
							onChange: setNewPassword,
							type: "password"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 130,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV(Button, {
							type: "submit",
							children: "Change password"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 131,
							columnNumber: 11
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 127,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 115,
				columnNumber: 9
			}, this), /* @__PURE__ */ _jsxDEV("section", {
				className: "rounded-2xl border border-line bg-ink-2/70 p-6",
				children: [
					/* @__PURE__ */ _jsxDEV("h2", {
						className: "text-lg font-semibold",
						children: "API tokens"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 136,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("p", {
						className: "mt-1 text-sm text-mist",
						children: "Use your access key and a token for nodes and automated API calls."
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 137,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "mt-4",
						children: [
							/* @__PURE__ */ _jsxDEV("span", {
								className: "mb-1.5 block text-xs font-medium text-fog",
								children: "Access key"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 139,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("input", {
								readOnly: true,
								type: showAccessKey ? "text" : "password",
								value: accessKey,
								className: "h-10 w-full rounded-xl border border-line bg-ink-3 px-3 font-mono text-xs"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 140,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "mt-2 flex flex-wrap gap-2",
								children: [
									/* @__PURE__ */ _jsxDEV(Button, {
										type: "button",
										size: "sm",
										variant: "ghost",
										onClick: () => setShowAccessKey((value) => !value),
										children: showAccessKey ? "Hide" : "Show"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 147,
										columnNumber: 15
									}, this),
									/* @__PURE__ */ _jsxDEV(Button, {
										type: "button",
										size: "sm",
										variant: "ghost",
										onClick: () => void copyValue(accessKey, "access-key"),
										children: copied === "access-key" ? "Copied" : "Copy"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 150,
										columnNumber: 15
									}, this),
									/* @__PURE__ */ _jsxDEV(Button, {
										type: "button",
										size: "sm",
										variant: "ghost",
										onClick: () => void onRegenerateAccessKey(),
										children: "Regenerate"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 153,
										columnNumber: 15
									}, this)
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 146,
								columnNumber: 13
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 138,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("form", {
						className: "mt-4 space-y-3",
						onSubmit: onCreateToken,
						children: [
							/* @__PURE__ */ _jsxDEV(Field, {
								label: "Token name",
								value: tokenName,
								onChange: setTokenName
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 160,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV(Field, {
								label: "Expiration (optional)",
								value: expiresAt,
								onChange: setExpiresAt,
								type: "date"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 161,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV(Button, {
								type: "submit",
								children: "Generate token"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 162,
								columnNumber: 13
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 159,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "mt-5 space-y-2",
						children: tokens.map((token) => /* @__PURE__ */ _jsxDEV("div", {
							className: "rounded-xl border border-line bg-ink-3 p-3",
							children: [
								/* @__PURE__ */ _jsxDEV("div", {
									className: "flex items-start justify-between gap-2",
									children: [/* @__PURE__ */ _jsxDEV("p", {
										className: "text-sm font-medium",
										children: [token.name, token.isDefault ? /* @__PURE__ */ _jsxDEV("span", {
											className: "ml-2 text-xs text-mist",
											children: "Default"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 171,
											columnNumber: 40
										}, this) : null]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 169,
										columnNumber: 19
									}, this), /* @__PURE__ */ _jsxDEV("p", {
										className: "text-xs text-mist",
										children: token.expiresAt ? `Expires ${new Date(token.expiresAt).toLocaleDateString()}` : "No expiration"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 173,
										columnNumber: 19
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 168,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ _jsxDEV("input", {
									readOnly: true,
									type: visibleTokens.has(token.id) ? "text" : "password",
									value: token.token || "",
									placeholder: token.requiresRegeneration ? "Old value unavailable â regenerate this token" : "",
									className: "mt-2 h-10 w-full rounded-xl border border-line bg-ink-2 px-3 font-mono text-xs"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 177,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ _jsxDEV("div", {
									className: "mt-2 flex flex-wrap gap-2",
									children: [
										token.token ? /* @__PURE__ */ _jsxDEV(_Fragment, { children: [/* @__PURE__ */ _jsxDEV(Button, {
											type: "button",
											size: "sm",
											variant: "ghost",
											onClick: () => setVisibleTokens((current) => {
												const next = new Set(current);
												if (next.has(token.id)) next.delete(token.id);
												else next.add(token.id);
												return next;
											}),
											children: visibleTokens.has(token.id) ? "Hide" : "Show"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 187,
											columnNumber: 23
										}, this), /* @__PURE__ */ _jsxDEV(Button, {
											type: "button",
											size: "sm",
											variant: "ghost",
											onClick: () => void copyValue(token.token, token.id),
											children: copied === token.id ? "Copied" : "Copy"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 195,
											columnNumber: 23
										}, this)] }, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 186,
											columnNumber: 21
										}, this) : null,
										/* @__PURE__ */ _jsxDEV(Button, {
											type: "button",
											size: "sm",
											variant: "ghost",
											onClick: () => void onRegenerateToken(token.id),
											children: token.requiresRegeneration ? "Regenerate to reveal" : "Regenerate"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 200,
											columnNumber: 19
										}, this),
										!token.isDefault ? /* @__PURE__ */ _jsxDEV(Button, {
											type: "button",
											size: "sm",
											variant: "ghost",
											onClick: () => void deleteApiToken(token.id).then(loadTokens).catch((e) => setError(e.message)),
											children: "Revoke"
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 204,
											columnNumber: 21
										}, this) : null
									]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 184,
									columnNumber: 17
								}, this)
							]
						}, token.id, true, {
							fileName: _jsxFileName,
							lineNumber: 167,
							columnNumber: 15
						}, this))
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 165,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 135,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 114,
			columnNumber: 7
		}, this)
	] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 101,
		columnNumber: 5
	}, this);
}
_s(ProfilePage, "n8qrc2FIRH5QswTxlkyp6Xdz2nY=", false, function() {
	return [useAuthStore];
});
_c = ProfilePage;
function Field({ label, value, onChange, type = "text" }) {
	return /* @__PURE__ */ _jsxDEV("label", {
		className: "block",
		children: [/* @__PURE__ */ _jsxDEV("span", {
			className: "mb-1.5 block text-xs font-medium text-fog",
			children: label
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 236,
			columnNumber: 7
		}, this), /* @__PURE__ */ _jsxDEV("input", {
			type,
			value,
			onChange: (event) => onChange(event.target.value),
			required: type !== "date",
			className: "h-10 w-full rounded-xl border border-line bg-ink-3 px-3 text-sm outline-none focus:border-signal/50"
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 237,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 235,
		columnNumber: 5
	}, this);
}
_c2 = Field;
var _c, _c2;
$RefreshReg$(_c, "ProfilePage");
$RefreshReg$(_c2, "Field");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/pages/ProfilePage.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/sameershaikh_uts/Projects/xpedite-for-mac/relay-console/src/pages/ProfilePage.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/sameershaikh_uts/Projects/xpedite-for-mac/relay-console/src/pages/ProfilePage.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/sameershaikh_uts/Projects/xpedite-for-mac/relay-console/src/pages/ProfilePage.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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LE1BQU0sS0FBSyxXQUFXO1VBQzVCOzs7O2tCQUNSOzs7O3FCQUNBO1VBQ0osd0JBQUMsUUFBRDtXQUFRLE1BQUs7V0FBUyxNQUFLO1dBQUssU0FBUTtXQUFRLGVBQWUsS0FBSyxrQkFBa0IsTUFBTSxFQUFFO3FCQUMzRixNQUFNLHVCQUF1Qix5QkFBeUI7VUFDakQ7Ozs7O1VBQ1AsQ0FBQyxNQUFNLFlBQ04sd0JBQUMsUUFBRDtXQUNFLE1BQUs7V0FDTCxNQUFLO1dBQ0wsU0FBUTtXQUNSLGVBQWUsS0FBSyxlQUFlLE1BQU0sRUFBRSxDQUFDLENBQUMsS0FBSyxVQUFVLENBQUMsQ0FBQyxPQUFPLE1BQWEsU0FBUyxFQUFFLE9BQU8sQ0FBQztxQkFDdEc7VUFFTzs7OztxQkFDTjtTQUNEOzs7Ozs7T0FDRjtTQS9DSyxNQUFNOzs7O2FBK0NYLENBQ047S0FDRTs7Ozs7SUFDRTs7Ozs7V0FDTjs7Ozs7O0NBQ0Y7Ozs7O0FBRVQ7Ozs7O0FBRUEsU0FBUyxNQUFNLEVBQ2IsT0FDQSxPQUNBLFVBQ0EsT0FBTyxVQU1OO0NBQ0QsT0FDRSx3QkFBQyxTQUFEO0VBQU8sV0FBVTtZQUFqQixDQUNFLHdCQUFDLFFBQUQ7R0FBTSxXQUFVO2FBQTZDO0VBQVk7Ozs7WUFDekUsd0JBQUMsU0FBRDtHQUNRO0dBQ0M7R0FDUCxXQUFXLFVBQVUsU0FBUyxNQUFNLE9BQU8sS0FBSztHQUNoRCxVQUFVLFNBQVM7R0FDbkIsV0FBVTtFQUNYOzs7O1VBQ0k7Ozs7OztBQUVYIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIlByb2ZpbGVQYWdlLnRzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVN0YXRlLCB0eXBlIEZvcm1FdmVudCB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgRW0sIFBhZ2VIZWFkZXIgfSBmcm9tICdAL2NvbXBvbmVudHMvbGF5b3V0L1BhZ2VIZWFkZXInXG5pbXBvcnQgeyBCdXR0b24gfSBmcm9tICdAL2NvbXBvbmVudHMvdWkvQnV0dG9uJ1xuaW1wb3J0IHsgdXNlQXV0aFN0b3JlIH0gZnJvbSAnQC9zdG9yZS9hdXRoJ1xuaW1wb3J0IHsgaW5pdGlhbHMgfSBmcm9tICdAL2xpYi91dGlscydcbmltcG9ydCB7XG4gIHR5cGUgQXBpVG9rZW5SZWNvcmQsXG4gIGNoYW5nZVBhc3N3b3JkLFxuICBjcmVhdGVBcGlUb2tlbixcbiAgZGVsZXRlQXBpVG9rZW4sXG4gIGxpc3RBcGlUb2tlbnMsXG4gIHJlZ2VuZXJhdGVBY2Nlc3NLZXksXG4gIHJlZ2VuZXJhdGVBcGlUb2tlbixcbn0gZnJvbSAnQC9saWIvaHViJ1xuXG5leHBvcnQgZnVuY3Rpb24gUHJvZmlsZVBhZ2UoKSB7XG4gIGNvbnN0IHVzZXIgPSB1c2VBdXRoU3RvcmUoKHMpID0+IHMudXNlcilcbiAgY29uc3QgW2FjY2Vzc0tleSwgc2V0QWNjZXNzS2V5XSA9IHVzZVN0YXRlKCcnKVxuICBjb25zdCBbdG9rZW5zLCBzZXRUb2tlbnNdID0gdXNlU3RhdGU8QXBpVG9rZW5SZWNvcmRbXT4oW10pXG4gIGNvbnN0IFt0b2tlbk5hbWUsIHNldFRva2VuTmFtZV0gPSB1c2VTdGF0ZSgnJylcbiAgY29uc3QgW2V4cGlyZXNBdCwgc2V0RXhwaXJlc0F0XSA9IHVzZVN0YXRlKCcnKVxuICBjb25zdCBbc2hvd0FjY2Vzc0tleSwgc2V0U2hvd0FjY2Vzc0tleV0gPSB1c2VTdGF0ZShmYWxzZSlcbiAgY29uc3QgW3Zpc2libGVUb2tlbnMsIHNldFZpc2libGVUb2tlbnNdID0gdXNlU3RhdGU8U2V0PHN0cmluZz4+KG5ldyBTZXQoKSlcbiAgY29uc3QgW2NvcGllZCwgc2V0Q29waWVkXSA9IHVzZVN0YXRlKCcnKVxuICBjb25zdCBbbWVzc2FnZSwgc2V0TWVzc2FnZV0gPSB1c2VTdGF0ZSgnJylcbiAgY29uc3QgW2Vycm9yLCBzZXRFcnJvcl0gPSB1c2VTdGF0ZSgnJylcbiAgY29uc3QgW2N1cnJlbnRQYXNzd29yZCwgc2V0Q3VycmVudFBhc3N3b3JkXSA9IHVzZVN0YXRlKCcnKVxuICBjb25zdCBbbmV3UGFzc3dvcmQsIHNldE5ld1Bhc3N3b3JkXSA9IHVzZVN0YXRlKCcnKVxuXG4gIGFzeW5jIGZ1bmN0aW9uIGxvYWRUb2tlbnMoKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbGlzdEFwaVRva2VucygpXG4gICAgc2V0QWNjZXNzS2V5KHJlc3VsdC5hY2Nlc3NLZXkpXG4gICAgc2V0VG9rZW5zKHJlc3VsdC50b2tlbnMpXG4gIH1cblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHZvaWQgbG9hZFRva2VucygpLmNhdGNoKChlOiBFcnJvcikgPT4gc2V0RXJyb3IoZS5tZXNzYWdlKSlcbiAgfSwgW10pXG5cbiAgYXN5bmMgZnVuY3Rpb24gb25DcmVhdGVUb2tlbihldmVudDogRm9ybUV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIHNldEVycm9yKCcnKVxuICAgIHNldE1lc3NhZ2UoJycpXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNyZWF0ZUFwaVRva2VuKHRva2VuTmFtZSwgZXhwaXJlc0F0IHx8IHVuZGVmaW5lZClcbiAgICAgIHNldEFjY2Vzc0tleShyZXN1bHQuYWNjZXNzS2V5KVxuICAgICAgc2V0VmlzaWJsZVRva2VucygoY3VycmVudCkgPT4gbmV3IFNldChjdXJyZW50KS5hZGQocmVzdWx0LnRva2VuLmlkKSlcbiAgICAgIHNldFRva2VuTmFtZSgnJylcbiAgICAgIHNldEV4cGlyZXNBdCgnJylcbiAgICAgIGF3YWl0IGxvYWRUb2tlbnMoKVxuICAgIH0gY2F0Y2ggKGU6IHVua25vd24pIHtcbiAgICAgIHNldEVycm9yKGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSlcbiAgICB9XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBjb3B5VmFsdWUodmFsdWU6IHN0cmluZywgbGFiZWw6IHN0cmluZykge1xuICAgIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHZhbHVlKVxuICAgIHNldENvcGllZChsYWJlbClcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiBzZXRDb3BpZWQoJycpLCAxNTAwKVxuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gb25SZWdlbmVyYXRlQWNjZXNzS2V5KCkge1xuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ1JlZ2VuZXJhdGUgYWNjZXNzIGtleT8gRXhpc3RpbmcgaW50ZWdyYXRpb25zIG11c3QgYmUgdXBkYXRlZCB3aXRoIHRoZSBuZXcga2V5LicpKSByZXR1cm5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVnZW5lcmF0ZUFjY2Vzc0tleSgpXG4gICAgICBzZXRBY2Nlc3NLZXkocmVzdWx0LmFjY2Vzc0tleSlcbiAgICAgIHNldFNob3dBY2Nlc3NLZXkodHJ1ZSlcbiAgICAgIHNldE1lc3NhZ2UoJ0FjY2VzcyBrZXkgcmVnZW5lcmF0ZWQuIFVwZGF0ZSBhbGwgbm9kZXMgYW5kIGF1dG9tYXRpb24gY2xpZW50cy4nKVxuICAgIH0gY2F0Y2ggKGU6IHVua25vd24pIHtcbiAgICAgIHNldEVycm9yKGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSlcbiAgICB9XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBvblJlZ2VuZXJhdGVUb2tlbihpZDogc3RyaW5nKSB7XG4gICAgaWYgKCF3aW5kb3cuY29uZmlybSgnUmVnZW5lcmF0ZSB0aGlzIHRva2VuPyBUaGUgb2xkIHRva2VuIHdpbGwgc3RvcCB3b3JraW5nIGltbWVkaWF0ZWx5LicpKSByZXR1cm5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgcmVnZW5lcmF0ZUFwaVRva2VuKGlkKVxuICAgICAgc2V0VmlzaWJsZVRva2VucygoY3VycmVudCkgPT4gbmV3IFNldChjdXJyZW50KS5hZGQoaWQpKVxuICAgICAgc2V0TWVzc2FnZSgnVG9rZW4gcmVnZW5lcmF0ZWQuIFVwZGF0ZSBpbnRlZ3JhdGlvbnMgdGhhdCB1c2VkIHRoZSBvbGQgdmFsdWUuJylcbiAgICAgIGF3YWl0IGxvYWRUb2tlbnMoKVxuICAgIH0gY2F0Y2ggKGU6IHVua25vd24pIHtcbiAgICAgIHNldEVycm9yKGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSlcbiAgICB9XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBvbkNoYW5nZVBhc3N3b3JkKGV2ZW50OiBGb3JtRXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgc2V0RXJyb3IoJycpXG4gICAgc2V0TWVzc2FnZSgnJylcbiAgICB0cnkge1xuICAgICAgYXdhaXQgY2hhbmdlUGFzc3dvcmQoY3VycmVudFBhc3N3b3JkLCBuZXdQYXNzd29yZClcbiAgICAgIHNldEN1cnJlbnRQYXNzd29yZCgnJylcbiAgICAgIHNldE5ld1Bhc3N3b3JkKCcnKVxuICAgICAgc2V0TWVzc2FnZSgnUGFzc3dvcmQgY2hhbmdlZCBzdWNjZXNzZnVsbHkuJylcbiAgICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgICBzZXRFcnJvcihlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2PlxuICAgICAgPFBhZ2VIZWFkZXJcbiAgICAgICAgZXllYnJvdz1cIlByb2ZpbGVcIlxuICAgICAgICB0aXRsZT17XG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIEFjY291bnQgPEVtPnByZWZlcmVuY2VzLjwvRW0+XG4gICAgICAgICAgPC8+XG4gICAgICAgIH1cbiAgICAgIC8+XG5cbiAgICAgIHtlcnJvciA/IDxwIGNsYXNzTmFtZT1cIm1iLTQgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLWRhbmdlci8zMCBiZy1kYW5nZXIvMTAgcC0zIHRleHQtc20gdGV4dC1kYW5nZXJcIj57ZXJyb3J9PC9wPiA6IG51bGx9XG4gICAgICB7bWVzc2FnZSA/IDxwIGNsYXNzTmFtZT1cIm1iLTQgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLWxpbmUgYmctaW5rLTMgcC0zIHRleHQtc20gdGV4dC1mb2dcIj57bWVzc2FnZX08L3A+IDogbnVsbH1cblxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIG1heC13LTR4bCBnYXAtNSBsZzpncmlkLWNvbHMtMlwiPlxuICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJyb3VuZGVkLTJ4bCBib3JkZXIgYm9yZGVyLWxpbmUgYmctaW5rLTIvNzAgcC02XCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggc2l6ZS0xNCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcm91bmRlZC0yeGwgYmctaW5rLTQgdGV4dC1sZyBmb250LXNlbWlib2xkIHRleHQtc2lnbmFsXCI+XG4gICAgICAgICAgICB7aW5pdGlhbHModXNlcj8ubmFtZSA/PyAnQVUnKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1zZW1pYm9sZFwiPnt1c2VyPy5uYW1lfTwvaDI+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbWlzdFwiPnt1c2VyPy5lbWFpbH08L3A+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJtdC0xIHRleHQteHMgY2FwaXRhbGl6ZSB0ZXh0LWZvZ1wiPnt1c2VyPy5yb2xlfTwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGZvcm0gY2xhc3NOYW1lPVwibXQtNiBzcGFjZS15LTRcIiBvblN1Ym1pdD17b25DaGFuZ2VQYXNzd29yZH0+XG4gICAgICAgICAgPGgzIGNsYXNzTmFtZT1cImZvbnQtc2VtaWJvbGRcIj5DaGFuZ2UgcGFzc3dvcmQ8L2gzPlxuICAgICAgICAgIDxGaWVsZCBsYWJlbD1cIkN1cnJlbnQgcGFzc3dvcmRcIiB2YWx1ZT17Y3VycmVudFBhc3N3b3JkfSBvbkNoYW5nZT17c2V0Q3VycmVudFBhc3N3b3JkfSB0eXBlPVwicGFzc3dvcmRcIiAvPlxuICAgICAgICAgIDxGaWVsZCBsYWJlbD1cIk5ldyBwYXNzd29yZCAobWluaW11bSAxMCBjaGFyYWN0ZXJzKVwiIHZhbHVlPXtuZXdQYXNzd29yZH0gb25DaGFuZ2U9e3NldE5ld1Bhc3N3b3JkfSB0eXBlPVwicGFzc3dvcmRcIiAvPlxuICAgICAgICAgIDxCdXR0b24gdHlwZT1cInN1Ym1pdFwiPkNoYW5nZSBwYXNzd29yZDwvQnV0dG9uPlxuICAgICAgICA8L2Zvcm0+XG4gICAgICAgIDwvc2VjdGlvbj5cblxuICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJyb3VuZGVkLTJ4bCBib3JkZXIgYm9yZGVyLWxpbmUgYmctaW5rLTIvNzAgcC02XCI+XG4gICAgICAgICAgPGgyIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1zZW1pYm9sZFwiPkFQSSB0b2tlbnM8L2gyPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIm10LTEgdGV4dC1zbSB0ZXh0LW1pc3RcIj5Vc2UgeW91ciBhY2Nlc3Mga2V5IGFuZCBhIHRva2VuIGZvciBub2RlcyBhbmQgYXV0b21hdGVkIEFQSSBjYWxscy48L3A+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtdC00XCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtYi0xLjUgYmxvY2sgdGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LWZvZ1wiPkFjY2VzcyBrZXk8L3NwYW4+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgcmVhZE9ubHlcbiAgICAgICAgICAgICAgdHlwZT17c2hvd0FjY2Vzc0tleSA/ICd0ZXh0JyA6ICdwYXNzd29yZCd9XG4gICAgICAgICAgICAgIHZhbHVlPXthY2Nlc3NLZXl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImgtMTAgdy1mdWxsIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1saW5lIGJnLWluay0zIHB4LTMgZm9udC1tb25vIHRleHQteHNcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtMiBmbGV4IGZsZXgtd3JhcCBnYXAtMlwiPlxuICAgICAgICAgICAgICA8QnV0dG9uIHR5cGU9XCJidXR0b25cIiBzaXplPVwic21cIiB2YXJpYW50PVwiZ2hvc3RcIiBvbkNsaWNrPXsoKSA9PiBzZXRTaG93QWNjZXNzS2V5KCh2YWx1ZSkgPT4gIXZhbHVlKX0+XG4gICAgICAgICAgICAgICAge3Nob3dBY2Nlc3NLZXkgPyAnSGlkZScgOiAnU2hvdyd9XG4gICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICA8QnV0dG9uIHR5cGU9XCJidXR0b25cIiBzaXplPVwic21cIiB2YXJpYW50PVwiZ2hvc3RcIiBvbkNsaWNrPXsoKSA9PiB2b2lkIGNvcHlWYWx1ZShhY2Nlc3NLZXksICdhY2Nlc3Mta2V5Jyl9PlxuICAgICAgICAgICAgICAgIHtjb3BpZWQgPT09ICdhY2Nlc3Mta2V5JyA/ICdDb3BpZWQnIDogJ0NvcHknfVxuICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgPEJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgc2l6ZT1cInNtXCIgdmFyaWFudD1cImdob3N0XCIgb25DbGljaz17KCkgPT4gdm9pZCBvblJlZ2VuZXJhdGVBY2Nlc3NLZXkoKX0+XG4gICAgICAgICAgICAgICAgUmVnZW5lcmF0ZVxuICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGZvcm0gY2xhc3NOYW1lPVwibXQtNCBzcGFjZS15LTNcIiBvblN1Ym1pdD17b25DcmVhdGVUb2tlbn0+XG4gICAgICAgICAgICA8RmllbGQgbGFiZWw9XCJUb2tlbiBuYW1lXCIgdmFsdWU9e3Rva2VuTmFtZX0gb25DaGFuZ2U9e3NldFRva2VuTmFtZX0gLz5cbiAgICAgICAgICAgIDxGaWVsZCBsYWJlbD1cIkV4cGlyYXRpb24gKG9wdGlvbmFsKVwiIHZhbHVlPXtleHBpcmVzQXR9IG9uQ2hhbmdlPXtzZXRFeHBpcmVzQXR9IHR5cGU9XCJkYXRlXCIgLz5cbiAgICAgICAgICAgIDxCdXR0b24gdHlwZT1cInN1Ym1pdFwiPkdlbmVyYXRlIHRva2VuPC9CdXR0b24+XG4gICAgICAgICAgPC9mb3JtPlxuXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtdC01IHNwYWNlLXktMlwiPlxuICAgICAgICAgICAge3Rva2Vucy5tYXAoKHRva2VuKSA9PiAoXG4gICAgICAgICAgICAgIDxkaXYga2V5PXt0b2tlbi5pZH0gY2xhc3NOYW1lPVwicm91bmRlZC14bCBib3JkZXIgYm9yZGVyLWxpbmUgYmctaW5rLTMgcC0zXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLXN0YXJ0IGp1c3RpZnktYmV0d2VlbiBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bVwiPlxuICAgICAgICAgICAgICAgICAgICB7dG9rZW4ubmFtZX1cbiAgICAgICAgICAgICAgICAgICAge3Rva2VuLmlzRGVmYXVsdCA/IDxzcGFuIGNsYXNzTmFtZT1cIm1sLTIgdGV4dC14cyB0ZXh0LW1pc3RcIj5EZWZhdWx0PC9zcGFuPiA6IG51bGx9XG4gICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbWlzdFwiPlxuICAgICAgICAgICAgICAgICAgICB7dG9rZW4uZXhwaXJlc0F0ID8gYEV4cGlyZXMgJHtuZXcgRGF0ZSh0b2tlbi5leHBpcmVzQXQpLnRvTG9jYWxlRGF0ZVN0cmluZygpfWAgOiAnTm8gZXhwaXJhdGlvbid9XG4gICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICByZWFkT25seVxuICAgICAgICAgICAgICAgICAgdHlwZT17dmlzaWJsZVRva2Vucy5oYXModG9rZW4uaWQpID8gJ3RleHQnIDogJ3Bhc3N3b3JkJ31cbiAgICAgICAgICAgICAgICAgIHZhbHVlPXt0b2tlbi50b2tlbiB8fCAnJ31cbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXt0b2tlbi5yZXF1aXJlc1JlZ2VuZXJhdGlvbiA/ICdPbGQgdmFsdWUgdW5hdmFpbGFibGUg4oCUIHJlZ2VuZXJhdGUgdGhpcyB0b2tlbicgOiAnJ31cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm10LTIgaC0xMCB3LWZ1bGwgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLWxpbmUgYmctaW5rLTIgcHgtMyBmb250LW1vbm8gdGV4dC14c1wiXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTIgZmxleCBmbGV4LXdyYXAgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICAgIHt0b2tlbi50b2tlbiA/IChcbiAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIHR5cGU9XCJidXR0b25cIiBzaXplPVwic21cIiB2YXJpYW50PVwiZ2hvc3RcIiBvbkNsaWNrPXsoKSA9PiBzZXRWaXNpYmxlVG9rZW5zKChjdXJyZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gbmV3IFNldChjdXJyZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5leHQuaGFzKHRva2VuLmlkKSkgbmV4dC5kZWxldGUodG9rZW4uaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIG5leHQuYWRkKHRva2VuLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5leHRcbiAgICAgICAgICAgICAgICAgICAgICB9KX0+XG4gICAgICAgICAgICAgICAgICAgICAgICB7dmlzaWJsZVRva2Vucy5oYXModG9rZW4uaWQpID8gJ0hpZGUnIDogJ1Nob3cnfVxuICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gdHlwZT1cImJ1dHRvblwiIHNpemU9XCJzbVwiIHZhcmlhbnQ9XCJnaG9zdFwiIG9uQ2xpY2s9eygpID0+IHZvaWQgY29weVZhbHVlKHRva2VuLnRva2VuISwgdG9rZW4uaWQpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtjb3BpZWQgPT09IHRva2VuLmlkID8gJ0NvcGllZCcgOiAnQ29weSd9XG4gICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICAgICAgKSA6IG51bGx9XG4gICAgICAgICAgICAgICAgICA8QnV0dG9uIHR5cGU9XCJidXR0b25cIiBzaXplPVwic21cIiB2YXJpYW50PVwiZ2hvc3RcIiBvbkNsaWNrPXsoKSA9PiB2b2lkIG9uUmVnZW5lcmF0ZVRva2VuKHRva2VuLmlkKX0+XG4gICAgICAgICAgICAgICAgICAgIHt0b2tlbi5yZXF1aXJlc1JlZ2VuZXJhdGlvbiA/ICdSZWdlbmVyYXRlIHRvIHJldmVhbCcgOiAnUmVnZW5lcmF0ZSd9XG4gICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIHshdG9rZW4uaXNEZWZhdWx0ID8gKFxuICAgICAgICAgICAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgc2l6ZT1cInNtXCJcbiAgICAgICAgICAgICAgICAgICAgICB2YXJpYW50PVwiZ2hvc3RcIlxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHZvaWQgZGVsZXRlQXBpVG9rZW4odG9rZW4uaWQpLnRoZW4obG9hZFRva2VucykuY2F0Y2goKGU6IEVycm9yKSA9PiBzZXRFcnJvcihlLm1lc3NhZ2UpKX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIFJldm9rZVxuICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICkgOiBudWxsfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICkpfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L3NlY3Rpb24+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG5mdW5jdGlvbiBGaWVsZCh7XG4gIGxhYmVsLFxuICB2YWx1ZSxcbiAgb25DaGFuZ2UsXG4gIHR5cGUgPSAndGV4dCcsXG59OiB7XG4gIGxhYmVsOiBzdHJpbmdcbiAgdmFsdWU6IHN0cmluZ1xuICBvbkNoYW5nZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWRcbiAgdHlwZT86IHN0cmluZ1xufSkge1xuICByZXR1cm4gKFxuICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9ja1wiPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibWItMS41IGJsb2NrIHRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1mb2dcIj57bGFiZWx9PC9zcGFuPlxuICAgICAgPGlucHV0XG4gICAgICAgIHR5cGU9e3R5cGV9XG4gICAgICAgIHZhbHVlPXt2YWx1ZX1cbiAgICAgICAgb25DaGFuZ2U9eyhldmVudCkgPT4gb25DaGFuZ2UoZXZlbnQudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgcmVxdWlyZWQ9e3R5cGUgIT09ICdkYXRlJ31cbiAgICAgICAgY2xhc3NOYW1lPVwiaC0xMCB3LWZ1bGwgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLWxpbmUgYmctaW5rLTMgcHgtMyB0ZXh0LXNtIG91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItc2lnbmFsLzUwXCJcbiAgICAgIC8+XG4gICAgPC9sYWJlbD5cbiAgKVxufVxuIl19

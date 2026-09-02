/*! Open Historia — portions (reasoning toggle + small-screen menu) © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
import React, { useEffect, useState } from "react";
import {
    DEFAULT_PROVIDER,
    PROVIDER_OPTIONS,
    getProviderMeta,
    getReasoningEnabled,
    providerSupportsModelDiscovery,
    setReasoningEnabled,
} from "../AI/providerConfig.js";
import {
    getLanguageOptions,
    getStoredChatLanguage,
    getStoredLanguage,
    setStoredChatLanguage,
    setStoredLanguage,
} from "../../runtime/i18n.js";
import {
    MAP_SETTING_KEYS,
    getMapSetting,
    setMapSetting,
} from "../../runtime/mapSettings.js";
import {
    SURFACE,
    BORDER,
    TEXT,
    FONT_UI,
    ACCENT,
    ACCENT_BRIGHT,
    ACCENT_FAINT,
    BORDER_ACCENT,
} from "./theme";

const baseStyle = {
    position: "fixed",
    backgroundColor: SURFACE,
    backdropFilter: "blur(4px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: TEXT,
    fontFamily: FONT_UI,
    borderRadius: "12px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.2)",
};

const labelStyle = {
    display: "block",
    fontSize: "0.82rem",
    marginBottom: "0.45rem",
    color: "rgba(232,221,200,0.92)",
    cursor: "text",
};

const inputStyle = {
    width: "100%",
    padding: "0.65rem 0.7rem",
    borderRadius: "8px",
    border: "1px solid rgba(232,221,200,0.16)",
    backgroundColor: "rgba(0,0,0,0.22)",
    color: TEXT,
    fontSize: "0.85rem",
    outline: "none",
    boxSizing: "border-box",
    cursor: "text",
};

const helperStyle = {
    marginTop: "0.35rem",
    fontSize: "0.74rem",
    color: "rgba(232,221,200,0.58)",
    lineHeight: 1.45,
};

const fieldGroupStyle = {
    marginBottom: "0.85rem",
};

function providerMatchesQuery(option, query) {
    if (!query) return true;

    const haystack = [
        option.label,
        option.group,
        option.description,
        ...(option.searchTerms ?? []),
    ]
    .join(" ")
    .toLowerCase();

    return haystack.includes(query);
}

function groupProviders(options) {
    const groups = [];

    for (const option of options) {
        let group = groups.find((entry) => entry.name === option.group);

        if (!group) {
            group = { name: option.group, items: [] };
            groups.push(group);
        }

        group.items.push(option);
    }

    return groups;
}

const LanguagePicker = ({ label, current, onSelect, saving = false, helperText }) => {
    const [query, setQuery] = useState("");
    const options = getLanguageOptions();
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
        ? options.filter((option) =>
            `${option.name} ${option.native} ${option.code}`.toLowerCase().includes(normalizedQuery))
        : options;
    const listed = filtered.some((option) => option.code === current);

    return (
        <div style={fieldGroupStyle}>
        <label style={labelStyle}>{label}</label>
        <input
        style={{ ...inputStyle, marginBottom: "0.4rem" }}
        type="text"
        value={query}
        placeholder="Search languages..."
        onChange={(event) => setQuery(event.target.value)}
        />
        <select
        data-no-translate
        value={listed ? current : ""}
        onChange={(event) => onSelect(event.target.value)}
        style={{ ...inputStyle, cursor: "pointer", opacity: saving ? 0.6 : 1 }}
        >
        {!listed && (
            <option value="" disabled>
            {filtered.length ? `${filtered.length} matches — pick one` : "No matching language"}
            </option>
        )}
        {filtered.map((option) => (
            <option key={option.code} value={option.code} style={{ color: "black" }}>
            {option.name}{option.native && option.native !== option.name ? ` — ${option.native}` : ""}
            </option>
        ))}
        </select>
        {helperText && (
            <div style={helperStyle}>
            {helperText}
            </div>
        )}
        </div>
    );
};

const LanguageSelector = () => {
    const [saving, setSaving] = useState(false);
    const current = getStoredLanguage();

    const applyLanguage = async (code) => {
        if (!code || code === current || saving) {
            return;
        }

        setSaving(true);
        // Saves on the server too, so the phone app follows the same choice.
        await setStoredLanguage(code);
        // Reload so the translator starts (or stops) cleanly and every
        // already-rendered string goes through it from scratch.
        window.location.reload();
    };

    return (
        <LanguagePicker label="UI language" current={current} onSelect={applyLanguage} saving={saving} />
    );
};

// Steers prompts only, so no reload — the next message picks it up.
const ChatLanguageSelector = () => {
    const [current, setCurrent] = useState(getStoredChatLanguage);

    const applyLanguage = (code) => {
        if (!code || code === current) {
            return;
        }

        setStoredChatLanguage(code);
        setCurrent(code);
    };

    return (
        <LanguagePicker
        label="AI chat language"
        current={current}
        onSelect={applyLanguage}
        helperText="What the advisor and diplomatic chats reply in. Defaults to your interface language."
        />
    );
};

const Toggle = ({ label, enabled, onToggle }) => (
    <div
    style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
    }}
    >
    <span style={{ fontSize: "0.9rem" }}>{label}</span>
    <button
    onClick={onToggle}
    style={{
        width: "3.5rem",
        height: "1.75rem",
        borderRadius: "1rem",
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "0.3s",
        backgroundColor: enabled ? ACCENT : "#4b5563",
    }}
    >
    <div
    style={{
        position: "absolute",
        top: "2px",
        left: enabled ? "1.8rem" : "2px",
        width: "1.5rem",
        height: "1.5rem",
        backgroundColor: "white",
        borderRadius: "50%",
        transition: "0.3s",
        boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        pointerEvents: "none",
    }}
    />
    </button>
    </div>
);

const ApiProviderSelector = ({ provider, onProviderChange }) => {
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [query, setQuery] = useState("");
    const selectedProvider = getProviderMeta(provider);
    const normalizedQuery = query.trim().toLowerCase();
    const filteredProviders = PROVIDER_OPTIONS.filter((option) => providerMatchesQuery(option, normalizedQuery));
    const groupedProviders = groupProviders(filteredProviders);

    useEffect(() => {
        setQuery("");
        setIsCatalogOpen(false);
    }, [provider]);

    const handleProviderSelect = (value) => {
        onProviderChange(value);
        setQuery("");
        setIsCatalogOpen(false);
    };

    return (
        <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.6rem", color: TEXT }}>
        AI Provider
        </label>

        <button
        onClick={() => setIsCatalogOpen((prev) => !prev)}
        style={{
            width: "100%",
            padding: "0.8rem 0.9rem",
            borderRadius: "10px",
            border: "1px solid rgba(232,221,200,0.12)",
            backgroundColor: "rgba(0,0,0,0.18)",
            color: TEXT,
            cursor: "pointer",
            textAlign: "left",
        }}
        >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>
        {selectedProvider.label}
        </div>
        <div style={{ marginTop: "0.2rem", fontSize: "0.72rem", color: "rgba(232,221,200,0.6)", lineHeight: 1.45 }}>
        {selectedProvider.group} · {selectedProvider.description}
        </div>
        </div>
        <div style={{ fontSize: "0.85rem", color: "rgba(232,221,200,0.7)" }}>
        {isCatalogOpen ? "Hide" : "Change"}
        </div>
        </div>
        </button>

        <div style={{ ...helperStyle, marginBottom: isCatalogOpen ? "0.65rem" : 0 }}>
        Searchable catalog instead of a wall of provider buttons.
        </div>

        {isCatalogOpen && (
            <div
            style={{
                marginTop: "0.7rem",
                padding: "0.75rem",
                borderRadius: "10px",
                border: "1px solid rgba(232,221,200,0.1)",
                backgroundColor: "rgba(232,221,200,0.04)",
            }}
            >
            <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search provider, protocol or gateway..."
            autoComplete="off"
            spellCheck={false}
            style={{
                ...inputStyle,
                marginBottom: "0.65rem",
            }}
            />

            <div style={{ maxHeight: "12rem", overflowY: "auto", scrollbarWidth: "none", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {groupedProviders.length > 0 ? groupedProviders.map((group) => (
                <div key={group.name}>
                <div style={{ marginBottom: "0.35rem", fontSize: "0.68rem", fontWeight: 700, color: "rgba(232,221,200,0.45)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {group.name}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {group.items.map((option) => {
                    const selected = option.value === provider;

                    return (
                        <button
                        key={option.value}
                        onClick={() => handleProviderSelect(option.value)}
                        style={{
                            width: "100%",
                            padding: "0.7rem 0.75rem",
                            borderRadius: "8px",
                            border: "1px solid",
                            borderColor: selected ? BORDER_ACCENT : "rgba(232,221,200,0.08)",
                            backgroundColor: selected ? ACCENT_FAINT : "rgba(0,0,0,0.16)",
                            color: TEXT,
                            cursor: "pointer",
                            textAlign: "left",
                        }}
                        >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}>
                        <span style={{ fontSize: "0.84rem", fontWeight: selected ? 700 : 600 }}>
                        {option.label}
                        </span>
                        {selected && (
                            <span style={{ fontSize: "0.68rem", color: ACCENT_BRIGHT, fontWeight: 700 }}>
                            Active
                            </span>
                        )}
                        </div>
                        <div style={{ marginTop: "0.18rem", fontSize: "0.72rem", lineHeight: 1.4, color: "rgba(232,221,200,0.6)" }}>
                        {option.description}
                        </div>
                        </button>
                    );
                })}
                </div>
                </div>
            )) : (
                <div style={{ ...helperStyle, marginTop: 0 }}>
                Nothing matched the search.
                </div>
            )}
            </div>
            </div>
        )}
        </div>
    );
};

const SettingsInput = ({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    helperText,
    multiline = false,
}) => (
    <div style={fieldGroupStyle}>
    <label style={labelStyle}>
    {label}
    </label>
    {multiline ? (
        <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        style={{ ...inputStyle, fontFamily: "monospace", resize: "vertical" }}
        />
    ) : (
        <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        style={inputStyle}
        />
    )}
    {helperText && (
        <div style={helperStyle}>
        {helperText}
        </div>
    )}
    </div>
);

const ProviderSettingsPanel = ({ provider, settings, onSettingChange }) => {
    const meta = getProviderMeta(provider);
    const supportsModelDiscovery = providerSupportsModelDiscovery(provider);
    // Global reasoning toggle — one switch, applied in every provider mode.
    const [reasoningOn, setReasoningOn] = useState(() => getReasoningEnabled());
    const toggleReasoning = () => {
        const next = !reasoningOn;
        setReasoningOn(next);
        setReasoningEnabled(next);
    };

    return (
        <div
        style={{
            marginBottom: "1rem",
            padding: "0.85rem",
            borderRadius: "10px",
            border: "1px solid rgba(232,221,200,0.1)",
            backgroundColor: "rgba(232,221,200,0.04)",
        }}
        >
        <div style={{ fontSize: "0.84rem", fontWeight: 700, marginBottom: "0.25rem" }}>
        {meta.label} Settings
        </div>
        <div style={{ ...helperStyle, marginTop: 0, marginBottom: "0.85rem" }}>
        {meta.description}
        </div>

        {provider === "gemini" && (
            <>
            <SettingsInput
            label="Gemini API Key"
            type="password"
            value={settings.geminiApiKey ?? ""}
            onChange={(value) => onSettingChange("geminiApiKey", value)}
            placeholder="Paste Gemini API key"
            helperText="Stored only in this browser."
            />
            <SettingsInput
            label="Model"
            value={settings.geminiModel ?? ""}
            onChange={(value) => onSettingChange("geminiModel", value)}
            placeholder="gemini-3.5-flash-lite"
            helperText="Leave blank to use the built-in Gemini default."
            />
            <SettingsInput
            label="Custom parameters (JSON)"
            multiline
            value={settings.geminiCustomParams ?? ""}
            onChange={(value) => onSettingChange("geminiCustomParams", value)}
            placeholder='{"generationConfig": {"topP": 0.9}}'
            helperText="Optional. Merged into the request body — e.g. to limit reasoning budget/effort. Invalid JSON is ignored."
            />
            </>
        )}

        {provider === "openai" && (
            <>
            <SettingsInput
            label="OpenAI API Key"
            type="password"
            value={settings.openaiApiKey ?? ""}
            onChange={(value) => onSettingChange("openaiApiKey", value)}
            placeholder="Paste OpenAI API key"
            helperText="Stored only in this browser."
            />
            <SettingsInput
            label="Model"
            value={settings.openaiModel ?? ""}
            onChange={(value) => onSettingChange("openaiModel", value)}
            placeholder="gpt-..."
            helperText={
                supportsModelDiscovery
                    ? "Leave blank to auto-pick a chat-capable model from /v1/models."
                    : "Enter the exact model id."
            }
            />
            <SettingsInput
            label="Custom parameters (JSON)"
            multiline
            value={settings.openaiCustomParams ?? ""}
            onChange={(value) => onSettingChange("openaiCustomParams", value)}
            placeholder='{"top_p": 0.9}'
            helperText="Optional. Merged into the request body — e.g. to limit reasoning budget/effort. Invalid JSON is ignored."
            />
            </>
        )}

        {provider === "anthropic" && (
            <>
            <SettingsInput
            label="Anthropic API Key"
            type="password"
            value={settings.anthropicApiKey ?? ""}
            onChange={(value) => onSettingChange("anthropicApiKey", value)}
            placeholder="Paste Anthropic API key"
            helperText="Stored only in this browser."
            />
            <SettingsInput
            label="Model"
            value={settings.anthropicModel ?? ""}
            onChange={(value) => onSettingChange("anthropicModel", value)}
            placeholder="claude-haiku-4-5"
            helperText="Claude model ids are manual here. Leave blank to use the built-in default."
            />
            <SettingsInput
            label="Custom parameters (JSON)"
            multiline
            value={settings.anthropicCustomParams ?? ""}
            onChange={(value) => onSettingChange("anthropicCustomParams", value)}
            placeholder='{"top_p": 0.9}'
            helperText="Optional. Merged into the request body — e.g. to limit reasoning budget/effort. Invalid JSON is ignored."
            />
            </>
        )}

        {provider === "openai-compatible" && (
            <>
            <SettingsInput
            label="API Endpoint"
            value={settings.openaiCompatibleEndpoint ?? ""}
            onChange={(value) => onSettingChange("openaiCompatibleEndpoint", value)}
            placeholder="http://localhost:11434/v1"
            // A server on the player's own machine works from the website too, but only
            // if it allows this origin — otherwise the browser silently drops the reply.
            // Say so up front here rather than letting it surface as "Failed to fetch".
            helperText={import.meta.env.VITE_OH_WEB
                ? "Base URL that exposes /chat/completions and /models. A server on your own machine (Ollama, LM Studio) also has to allow this site: start Ollama with OLLAMA_ORIGINS set to this site's address, or use the desktop app."
                : "Base URL that exposes /chat/completions and /models."}
            />
            <SettingsInput
            label="API Key (optional)"
            type="password"
            value={settings.openaiCompatibleApiKey ?? ""}
            onChange={(value) => onSettingChange("openaiCompatibleApiKey", value)}
            placeholder="Leave empty for local Ollama"
            helperText="Use a bearer token if your gateway requires authentication."
            />
            <SettingsInput
            label="Model"
            value={settings.openaiCompatibleModel ?? ""}
            onChange={(value) => onSettingChange("openaiCompatibleModel", value)}
            placeholder="llama / qwen / gpt / mistral"
            helperText="Leave blank to auto-pick a model from /models."
            />
            <SettingsInput
            label="Custom parameters (JSON)"
            multiline
            value={settings.openaiCompatibleCustomParams ?? ""}
            onChange={(value) => onSettingChange("openaiCompatibleCustomParams", value)}
            placeholder='{"top_p": 0.9}'
            helperText="Optional. Merged into the request body — e.g. to limit reasoning budget/effort. Invalid JSON is ignored."
            />
            </>
        )}

        {provider === "anthropic-compatible" && (
            <>
            <SettingsInput
            label="API Endpoint"
            value={settings.anthropicCompatibleEndpoint ?? ""}
            onChange={(value) => onSettingChange("anthropicCompatibleEndpoint", value)}
            placeholder="https://my-proxy.example/v1"
            helperText="Base URL of a self-hosted proxy that speaks the Anthropic Messages API (POST /messages). Routed through the game server to avoid CORS."
            />
            <SettingsInput
            label="API Key (optional)"
            type="password"
            value={settings.anthropicCompatibleApiKey ?? ""}
            onChange={(value) => onSettingChange("anthropicCompatibleApiKey", value)}
            placeholder="Sent as x-api-key if set"
            helperText="Leave empty if your proxy doesn't require a key."
            />
            <SettingsInput
            label="Model"
            value={settings.anthropicCompatibleModel ?? ""}
            onChange={(value) => onSettingChange("anthropicCompatibleModel", value)}
            placeholder="claude-haiku-4-5"
            helperText="The model id your proxy expects. Leave blank to use the built-in default."
            />
            <SettingsInput
            label="Custom parameters (JSON)"
            multiline
            value={settings.anthropicCompatibleCustomParams ?? ""}
            onChange={(value) => onSettingChange("anthropicCompatibleCustomParams", value)}
            placeholder='{"top_p": 0.9}'
            helperText="Optional. Merged into the request body — e.g. to limit reasoning budget/effort. Invalid JSON is ignored."
            />
            </>
        )}

        <div style={{ marginTop: "0.5rem" }}>
        <Toggle
        label="Model reasoning"
        enabled={reasoningOn}
        onToggle={toggleReasoning}
        />
        <div style={{ ...helperStyle, marginTop: "-0.6rem" }}>
        Lets thinking-capable models reason before answering (Gemini thinking, OpenAI
        reasoning effort, Claude extended thinking). Slower and costs more tokens;
        needs a model that supports it.
        </div>
        </div>
        </div>
    );
};

const SettingsButton = ({ onToggle, topOffset = "0.5rem" }) => (
    <button
    onClick={onToggle}
    style={{
        ...baseStyle,
        top: topOffset,
        left: "0.5rem",
        height: "4rem",
        width: "4rem",
        cursor: "pointer",
        fontSize: "1.8rem",
        fontWeight: 700,
    }}
    >
    ⋮
    </button>
);

const SettingsMenu = ({
    topOffset = "0.5rem",
    isFullscreenEnabled,
    isGlobeEnabled,
    isTerrainEnabled,
    onToggleFullscreen,
    onToggleGlobe,
    onToggleTerrain,
    apiProvider,
    onApiProviderChange,
    providerSettings,
    onProviderSettingChange,
    onOpenCheats,
}) => {
    const selectedProvider = apiProvider ?? DEFAULT_PROVIDER;

    const [mapSettings, setMapSettingsState] = useState(() => ({
        hideCountryLabels: getMapSetting(MAP_SETTING_KEYS.hideCountryLabels),
        disableIdleRotation: getMapSetting(MAP_SETTING_KEYS.disableIdleRotation),
        disableEventCamera: getMapSetting(MAP_SETTING_KEYS.disableEventCamera),
        limitAiGeneration: getMapSetting(MAP_SETTING_KEYS.limitAiGeneration),
    }));

    const updateMapSetting = (stateKey, settingKey, value) => {
        setMapSetting(settingKey, value);
        setMapSettingsState((current) => ({ ...current, [stateKey]: value }));
    };

    return (
        <div
        style={{
            ...baseStyle,
            top: `calc(${topOffset} + 4.25rem)`,
            left: "0.5rem",
            width: "22rem",
            maxWidth: "calc(100vw - 1rem)",
            // Never taller than the space below the panel's own top edge — the old
            // 100vh-5rem pushed the bottom (Discord/GitHub links) off short screens.
            maxHeight: `calc(100vh - ${topOffset} - 5.25rem)`,
            overflowY: "auto",
            padding: "1rem",
            flexDirection: "column",
            alignItems: "stretch",
            justifyContent: "flex-start",
            height: "auto",
        }}
        >
        <h3
        style={{
            margin: "0 -1rem 1rem -1rem",
            padding: "0 1rem 1rem 1rem",
            fontSize: "1.1rem",
            textAlign: "left",
            borderBottom: "1px solid rgba(232,221,200,0.1)",
        }}
        >
        Game Settings
        </h3>

        <ApiProviderSelector
        provider={selectedProvider}
        onProviderChange={onApiProviderChange ?? (() => {})}
        />

        <ProviderSettingsPanel
        provider={selectedProvider}
        settings={providerSettings ?? {}}
        onSettingChange={onProviderSettingChange ?? (() => {})}
        />

        <LanguageSelector />
        <ChatLanguageSelector />

        <Toggle label="Fullscreen" enabled={isFullscreenEnabled} onToggle={onToggleFullscreen} />
        <Toggle label="3D Globe" enabled={isGlobeEnabled} onToggle={onToggleGlobe} />
        <div style={{ marginTop: "-0.85rem", marginBottom: "1rem" }}>
        <span
        style={{
            backgroundColor: "rgba(245,158,11,0.16)",
            border: "1px solid rgba(245,158,11,0.45)",
            borderRadius: "999px",
            color: "#fbbf24",
            fontSize: "0.66rem",
            fontWeight: 700,
            letterSpacing: "0.02em",
            padding: "0.16rem 0.55rem",
        }}
        >
        Very Experimental
        </span>
        </div>
        <Toggle label="3D Terrain" enabled={isTerrainEnabled} onToggle={onToggleTerrain} />
        <div style={{ margin: "0.5rem 0 1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(232,221,200,0.1)" }}>
        <div style={{ fontSize: "0.84rem", fontWeight: 700, marginBottom: "0.6rem" }}>Map</div>
        <Toggle
        label="Hide country labels"
        enabled={mapSettings.hideCountryLabels}
        onToggle={() => updateMapSetting("hideCountryLabels", MAP_SETTING_KEYS.hideCountryLabels, !mapSettings.hideCountryLabels)}
        />
        <Toggle
        label="Reduce motion"
        enabled={mapSettings.disableIdleRotation && mapSettings.disableEventCamera}
        onToggle={() => {
            // Umbrella accessibility control: on = stop both the idle globe spin
            // and the fly-to during events; the two toggles below stay for
            // granular control and reflect the result.
            const next = !(mapSettings.disableIdleRotation && mapSettings.disableEventCamera);
            updateMapSetting("disableIdleRotation", MAP_SETTING_KEYS.disableIdleRotation, next);
            updateMapSetting("disableEventCamera", MAP_SETTING_KEYS.disableEventCamera, next);
        }}
        />
        <Toggle
        label="Disable idle globe rotation"
        enabled={mapSettings.disableIdleRotation}
        onToggle={() => updateMapSetting("disableIdleRotation", MAP_SETTING_KEYS.disableIdleRotation, !mapSettings.disableIdleRotation)}
        />
        <Toggle
        label="Disable camera movement during events"
        enabled={mapSettings.disableEventCamera}
        onToggle={() => updateMapSetting("disableEventCamera", MAP_SETTING_KEYS.disableEventCamera, !mapSettings.disableEventCamera)}
        />
        </div>

        <div style={{ margin: "0.5rem 0 1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(232,221,200,0.1)" }}>
        <div style={{ fontSize: "0.84rem", fontWeight: 700, marginBottom: "0.6rem" }}>AI</div>
        <Toggle
        label="Limit AI generation"
        enabled={mapSettings.limitAiGeneration}
        onToggle={() => updateMapSetting("limitAiGeneration", MAP_SETTING_KEYS.limitAiGeneration, !mapSettings.limitAiGeneration)}
        />
        <div style={{ marginTop: "-0.7rem", marginBottom: "0.4rem", fontSize: "0.72rem", color: "rgba(232,221,200,0.45)", lineHeight: 1.35 }}>
        On: time skips give the model 5 minutes, then fall back to canned events. Off (default): generation waits as long as the model needs. Cancel works either way.
        </div>
        </div>

        {typeof onOpenCheats === "function" && (
            <button
            type="button"
            onClick={onOpenCheats}
            style={{
                alignItems: "center",
                background: "rgba(138, 3, 3, 0.22)",
                border: "1px solid rgba(138, 3, 3, 0.45)",
                borderRadius: "8px",
                color: TEXT,
                cursor: "pointer",
                display: "flex",
                fontSize: "0.9rem",
                fontWeight: 600,
                gap: "0.5rem",
                justifyContent: "center",
                marginBottom: "1rem",
                padding: "0.6rem 0.7rem",
                width: "100%",
            }}
            >
            🧪 Cheats
            </button>
        )}

        <a
        href="/guides/"
        style={{
            alignItems: "center",
            background: "rgba(138, 3, 3, 0.18)",
            border: "1px solid rgba(138, 3, 3, 0.4)",
            borderRadius: "8px",
            color: TEXT,
            cursor: "pointer",
            display: "flex",
            fontSize: "0.9rem",
            fontWeight: 600,
            gap: "0.5rem",
            justifyContent: "center",
            marginBottom: "1rem",
            padding: "0.6rem 0.7rem",
            textDecoration: "none",
            width: "100%",
        }}
        >
        📖 Guides
        </a>

        </div>
    );
};

export { Toggle, SettingsButton, SettingsMenu, ApiProviderSelector };

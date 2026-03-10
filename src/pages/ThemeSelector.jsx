import React, { useState } from "react";

const themes = [
    {
        id: "clinical-noir",
        name: "Clinical Noir",
        tag: "Dark + Precision",
        tagline: "Medical-grade dark UI — like an ICU monitor meets Bloomberg Terminal",
        description: "Deep charcoal backgrounds, acid-green vitals, monospace data readouts. Every pixel feels mission-critical. Perfect for pharmacists who trust their tools.",
        fonts: ["'IBM Plex Mono'", "'DM Sans'"],
        colors: { bg: "#0a0f0d", surface: "#111916", accent: "#00ff88", accent2: "#00ccff", text: "#e8f5e9", muted: "#4a7a5c", danger: "#ff4444", warn: "#ffaa00" },
        vibe: "🖥️ High-trust, clinical authority",
        bestFor: "Pharmacy admins, ICU/hospital settings",
    },
    {
        id: "soft-biomed",
        name: "Soft BioMed",
        tag: "Light + Organic",
        tagline: "Healthcare warmth meets Swiss design precision",
        description: "Warm off-whites, sage greens, rounded cards. Friendly and approachable — reduces cognitive load during high-stress inventory management.",
        fonts: ["'Fraunces'", "'Instrument Sans'"],
        colors: { bg: "#f5f2ec", surface: "#ffffff", accent: "#2d6a4f", accent2: "#74b49b", text: "#1a2e22", muted: "#8aab96", danger: "#c0392b", warn: "#e67e22" },
        vibe: "🌿 Calm, trustworthy, human",
        bestFor: "Community pharmacies, patient-facing contexts",
    },
    {
        id: "ops-command",
        name: "Ops Command",
        tag: "Dark + Bold + Industrial",
        tagline: "Supply chain war room — built for speed and scale",
        description: "Deep navy, electric blue accents, sharp geometric layout. Feels like mission control. Built for pharmacists managing multi-branch inventory at scale.",
        fonts: ["'Syne'", "'Space Grotesk'"],
        colors: { bg: "#060b18", surface: "#0d1530", accent: "#3b82f6", accent2: "#818cf8", text: "#e2e8f0", muted: "#475569", danger: "#f43f5e", warn: "#f59e0b" },
        vibe: "⚡ Powerful, fast, enterprise",
        bestFor: "Chain pharmacies, large hospitals",
    },
    {
        id: "apothecary-luxe",
        name: "Apothecary Luxe",
        tag: "Editorial + Premium",
        tagline: "Where pharmacy management meets luxury editorial design",
        description: "Cream and deep burgundy, serif display headers, structured grid layouts. Commands respect. Feels like a high-end medical journal merged with a Bloomberg dashboard.",
        fonts: ["'Playfair Display'", "'Libre Franklin'"],
        colors: { bg: "#faf8f5", surface: "#ffffff", accent: "#8b1a2f", accent2: "#c9956a", text: "#1c0a12", muted: "#9e8e8e", danger: "#c0392b", warn: "#d4821a" },
        vibe: "✦ Premium, editorial, distinguished",
        bestFor: "Private hospitals, branded pharmacy chains",
    },
];

const MockDashboard = ({ theme }) => {
    const c = theme.colors;
    const isLight = theme.id === "soft-biomed" || theme.id === "apothecary-luxe";
    const ff = theme.fonts;

    const stats = [
        { label: "Total Drugs", value: "1,284", change: "+12", icon: "💊" },
        { label: "Critical Stock", value: "7", change: "Urgent", icon: "🚨", alert: true },
        { label: "Expiring Soon", value: "23", change: "< 30 days", icon: "⏳", warn: true },
        { label: "Active POs", value: "5", change: "Drafts", icon: "📋" },
    ];

    const items = [
        { name: "Paracetamol 500mg", stock: 12, threshold: 50, status: "critical" },
        { name: "Amoxicillin 250mg", stock: 34, threshold: 100, status: "warning" },
        { name: "Insulin Glargine", stock: 8, threshold: 20, status: "critical" },
        { name: "Metformin 500mg", stock: 156, threshold: 80, status: "ok" },
    ];

    const fontStack = `${ff[0]}, sans-serif`;
    const bodyFont = `${ff[1]}, sans-serif`;

    return (
        <div style={{
            background: c.bg,
            minHeight: "100%",
            fontFamily: bodyFont,
            color: c.text,
            display: "flex",
            fontSize: "13px",
        }}>
            {/* Sidebar */}
            <div style={{
                width: "200px",
                background: c.surface,
                borderRight: `1px solid ${c.muted}22`,
                padding: "20px 0",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                flexShrink: 0,
            }}>
                <div style={{ padding: "0 16px 20px", borderBottom: `1px solid ${c.muted}22`, marginBottom: "8px" }}>
                    <div style={{ fontFamily: fontStack, fontWeight: 700, fontSize: "16px", color: c.accent, letterSpacing: "-0.5px" }}>
                        PharmAgent
                    </div>
                    <div style={{ fontSize: "10px", color: c.muted, marginTop: "2px" }}>AI Pharmacy Platform</div>
                </div>
                {["Dashboard", "Inventory", "Procurement", "Expiry Mgr", "Financials", "Patient Care", "Alerts"].map((item, i) => (
                    <div key={item} style={{
                        padding: "8px 16px",
                        background: i === 0 ? `${c.accent}22` : "transparent",
                        borderRight: i === 0 ? `3px solid ${c.accent}` : "3px solid transparent",
                        color: i === 0 ? c.accent : c.muted,
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: i === 0 ? 600 : 400,
                    }}>{item}</div>
                ))}
                <div style={{ flex: 1 }} />
                <div style={{
                    margin: "0 12px",
                    padding: "10px",
                    background: `${c.accent}15`,
                    borderRadius: "8px",
                    border: `1px solid ${c.accent}44`,
                }}>
                    <div style={{ fontSize: "10px", color: c.accent, fontWeight: 700, marginBottom: "4px" }}>⚡ AGENT ACTIVE</div>
                    <div style={{ fontSize: "10px", color: c.muted }}>Next scan in 24s</div>
                </div>
            </div>

            {/* Main */}
            <div style={{ flex: 1, padding: "24px", overflow: "auto" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                    <div>
                        <div style={{ fontFamily: fontStack, fontSize: "22px", fontWeight: 700, letterSpacing: "-0.5px" }}>
                            Good morning, Dr. Sharma
                        </div>
                        <div style={{ color: c.muted, fontSize: "12px", marginTop: "2px" }}>
                            DEMO Pharmacy · Monday, Mar 09 · 3 critical alerts pending
                        </div>
                    </div>
                    <div style={{
                        background: c.danger,
                        color: "#fff",
                        padding: "6px 14px",
                        borderRadius: theme.id === "apothecary-luxe" ? "2px" : "6px",
                        fontSize: "12px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}>🚨 3 Critical</div>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
                    {stats.map(s => (
                        <div key={s.label} style={{
                            background: c.surface,
                            border: `1px solid ${s.alert ? c.danger + "44" : s.warn ? c.warn + "44" : c.muted + "22"}`,
                            borderRadius: theme.id === "apothecary-luxe" ? "4px" : theme.id === "soft-biomed" ? "16px" : "8px",
                            padding: "16px",
                            position: "relative",
                            overflow: "hidden",
                        }}>
                            {(s.alert || s.warn) && <div style={{
                                position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                                background: s.alert ? c.danger : c.warn,
                            }} />}
                            <div style={{ fontSize: "20px", marginBottom: "6px" }}>{s.icon}</div>
                            <div style={{ fontFamily: fontStack, fontSize: "24px", fontWeight: 700, color: s.alert ? c.danger : s.warn ? c.warn : c.accent }}>
                                {s.value}
                            </div>
                            <div style={{ color: c.muted, fontSize: "11px", marginTop: "2px" }}>{s.label}</div>
                            <div style={{ color: s.alert ? c.danger : s.warn ? c.warn : c.muted, fontSize: "10px", marginTop: "4px", fontWeight: 600 }}>
                                {s.change}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div style={{
                    background: c.surface,
                    border: `1px solid ${c.muted}22`,
                    borderRadius: theme.id === "apothecary-luxe" ? "4px" : theme.id === "soft-biomed" ? "16px" : "8px",
                    overflow: "hidden",
                }}>
                    <div style={{
                        padding: "14px 16px",
                        borderBottom: `1px solid ${c.muted}22`,
                        fontFamily: fontStack,
                        fontWeight: 600,
                        fontSize: "13px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}>
                        <span>Critical Replenishment Queue</span>
                        <span style={{ fontSize: "11px", color: c.accent, fontWeight: 400, cursor: "pointer" }}>View All →</span>
                    </div>
                    {items.map((item, i) => (
                        <div key={item.name} style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "10px 16px",
                            borderBottom: i < items.length - 1 ? `1px solid ${c.muted}15` : "none",
                            background: item.status === "critical" ? `${c.danger}08` : "transparent",
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500, fontSize: "12px" }}>{item.name}</div>
                                <div style={{ color: c.muted, fontSize: "11px", marginTop: "2px" }}>
                                    Stock: {item.stock} · Threshold: {item.threshold}
                                </div>
                            </div>
                            <div style={{
                                background: item.status === "critical" ? c.danger : item.status === "warning" ? c.warn : `${c.accent}22`,
                                color: item.status === "ok" ? c.accent : "#fff",
                                padding: "3px 10px",
                                borderRadius: "20px",
                                fontSize: "10px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                            }}>
                                {item.status === "critical" ? "🚨 Critical" : item.status === "warning" ? "⚠️ Warning" : "✓ OK"}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function ThemeSelector() {
    const [active, setActive] = useState(themes[0].id);
    const theme = themes.find(t => t.id === active);

    return (
        <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0d0d0d", minHeight: "100vh", color: "#fff" }}>
            <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=DM+Sans:wght@400;500;600&family=Fraunces:ital,wght@0,400;0,700;1,400&family=Instrument+Sans:wght@400;500;600&family=Syne:wght@600;700;800&family=Space+Grotesk:wght@400;500;600&family=Playfair+Display:wght@600;700&family=Libre+Franklin:wght@400;500;600&display=swap" rel="stylesheet" />

            {/* Header */}
            <div style={{ padding: "24px 32px 0", maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "13px", color: "#888", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>
                    PharmAgent — UI Direction Selector
                </div>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 800, margin: "0 0 6px" }}>
                    Choose Your UI Direction
                </h1>
                <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
                    Click a concept to preview it live below. Share your pick and I'll rebuild the full app.
                </p>
            </div>

            {/* Theme Cards */}
            <div style={{ padding: "20px 32px", maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                {themes.map(t => (
                    <div
                        key={t.id}
                        onClick={() => setActive(t.id)}
                        style={{
                            background: active === t.id ? "#1a1a1a" : "#111",
                            border: `2px solid ${active === t.id ? t.colors.accent : "#222"}`,
                            borderRadius: "12px",
                            padding: "16px",
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                    >
                        <div style={{
                            display: "inline-block",
                            background: t.colors.accent + "22",
                            color: t.colors.accent,
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                            marginBottom: "10px",
                        }}>{t.tag}</div>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "15px", marginBottom: "6px" }}>{t.name}</div>
                        <div style={{ color: "#777", fontSize: "11px", lineHeight: 1.5, marginBottom: "10px" }}>{t.tagline}</div>
                        <div style={{ fontSize: "11px", color: "#555" }}>{t.bestFor}</div>
                        {active === t.id && (
                            <div style={{ marginTop: "10px", color: t.colors.accent, fontSize: "11px", fontWeight: 600 }}>▶ Previewing</div>
                        )}
                    </div>
                ))}
            </div>

            {/* Live Preview */}
            <div style={{ padding: "0 32px 16px", maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: "12px",
                }}>
                    <div>
                        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: 700 }}>{theme.name}</span>
                        <span style={{ color: "#666", fontSize: "13px", marginLeft: "12px" }}>{theme.vibe}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#555", fontStyle: "italic" }}>{theme.description}</div>
                </div>

                <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid #222", height: "520px" }}>
                    <MockDashboard theme={theme} />
                </div>
            </div>

            {/* CTA */}
            <div style={{ padding: "0 32px 40px", maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ background: "#111", border: "1px solid #222", borderRadius: "12px", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: "4px" }}>Ready to rebuild?</div>
                        <div style={{ color: "#666", fontSize: "13px" }}>Tell me which direction you like (or mix two), and I'll redesign your entire app.</div>
                    </div>
                    <div style={{ color: "#888", fontSize: "13px" }}>← Pick a concept above</div>
                </div>
            </div>
        </div>
    );
}

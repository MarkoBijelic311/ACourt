
import { useState, type FormEvent } from "react";
import "./App.css";

async function analyzeCase(name: string, caseDescription: string) {
    const res = await fetch("http://localhost:3001/api/case", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name,
            caseDescription
        })
    });

    if (!res.ok) {
        throw new Error("Failed to submit case.");
    }

    // Čekanje na završetak analize
    for (let i = 0; i < 60; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const response = await fetch("http://localhost:3001/api/analysis");

        if (!response.ok) {
            throw new Error("Failed to retrieve analysis.");
        }

        const data = await response.json();

        if (data.status === "done") {
            return data.analysis;
        }

        if (data.status === "error") {
            throw new Error(data.error || "Analysis failed.");
        }
    }

    throw new Error("Analysis timed out.");
}

function App() {
    const [name, setName] = useState("");
    const [caseDescription, setCaseDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState("");
    const [error, setError] = useState("");

    async function submitCase(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!name.trim() || !caseDescription.trim()) {
            setError("Please fill in both fields.");
            return;
        }

        setLoading(true);
        setError("");
        setAnalysis("");

        try {
            const result = await analyzeCase(name, caseDescription);

            setAnalysis(JSON.stringify(result, null, 2));
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "An unexpected error occurred."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="pozadina">
            <form className="papir" onSubmit={submitCase}>
                <header className="zaglavlje">
                    <svg
                        className="vaga"
                        viewBox="0 0 120 100"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M60 12 V82" />
                        <path d="M35 82 H85" />
                        <path d="M45 88 H75" />
                        <path d="M60 12 L54 19 H66 Z" />
                        <path d="M25 32 H95" />
                        <path d="M60 22 V32" />
                        <path d="M25 32 L12 62" />
                        <path d="M25 32 L38 62" />
                        <path d="M95 32 L82 62" />
                        <path d="M95 32 L108 62" />
                        <path d="M8 62 Q25 75 42 62" />
                        <path d="M78 62 Q95 75 112 62" />
                    </svg>

                    <h1>JUDICIAL PROCEEDINGS</h1>
                    <p>CRIMINAL CASE REGISTRATION</p>
                </header>

                <div className="polje">
                    <label htmlFor="name">Defendant's Full Name</label>
                    <input
                        id="name"
                        type="text"
                        placeholder="Enter full name..."
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                </div>

                <div className="polje">
                    <label htmlFor="caseDescription">Case Description</label>
                    <textarea
                        id="caseDescription"
                        placeholder="Describe the alleged actions and the charges against the defendant..."
                        value={caseDescription}
                        onChange={(event) =>
                            setCaseDescription(event.target.value)
                        }
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "ANALYZING CASE..." : "SUBMIT CASE"}
                </button>

                {error && (
                    <p className="status-greska">{error}</p>
                )}

                {analysis && (
                    <div className="rezultat">
                        <h2>CASE ANALYSIS</h2>
                        <pre>{analysis}</pre>
                    </div>
                )}
            </form>
        </main>
    );
}

export default App;

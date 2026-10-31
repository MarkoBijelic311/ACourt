import { useState } from "react";
import DeskPage from "./pages/DeskPage";
import LoadingPage from "./pages/LoadingPage";
import CaseAnalysisPage from "./pages/CaseAnalysisPage";
import EvidencePage from "./pages/EvidencePage";
import ArgumentsPage from "./pages/ArgumentsPage";
import ClosingPage from "./pages/ClosingPage";
import { runCase } from "./api/court";
import type { CaseInput, CaseReport } from "./types";

type Page = "form" | "loading" | "analysis" | "evidence" | "arguments" | "closing" | "verdict";

export default function App() {
  const [page, setPage] = useState<Page>("form");
  const [caseReport, setCaseReport] = useState<CaseReport | null>(null);
  const [pendingInput, setPendingInput] = useState<CaseInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState("The agents are reviewing the case…");

  async function handleFileCase(input: CaseInput) {
    setPendingInput(input);
    setError(null);
    setLoadingText("The agents are reviewing the case…");
    setPage("loading");
    try {
      const report = await runCase(input, (stage) => setLoadingText(stage));
      setCaseReport(report);
      setPage("analysis");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while filing the case.");
      setPage("form");
    }
  }

  function handleNewCase() {
    setCaseReport(null);
    setPendingInput(null);
    setError(null);
    setPage("form");
  }

  switch (page) {
    case "form":
      return (
        <DeskPage
          mode="form"
          onFileCase={handleFileCase}
          error={error}
          initialInput={pendingInput}
        />
      );

    case "loading":
      return <LoadingPage text={loadingText} />;

    case "analysis":
      if (!caseReport) return <LoadingPage />;
      return (
        <CaseAnalysisPage
          analysis={caseReport.analysis}
          onBack={handleNewCase}
          onNext={() => setPage("evidence")}
        />
      );

    case "evidence":
      if (!caseReport) return <LoadingPage />;
      return (
        <EvidencePage
          evidence={caseReport.evidence}
          onBack={() => setPage("analysis")}
          onNext={() => setPage("arguments")}
        />
      );

    case "arguments":
      if (!caseReport) return <LoadingPage />;
      return (
        <ArgumentsPage
          caseArguments={caseReport.arguments}
          onBack={() => setPage("evidence")}
          onNext={() => setPage("closing")}
        />
      );

    case "closing":
      if (!caseReport) return <LoadingPage />;
      return (
        <ClosingPage
          closing={caseReport.closing}
          onBack={() => setPage("arguments")}
          onReachVerdict={() => setPage("verdict")}
        />
      );

    case "verdict":
      if (!caseReport) return <LoadingPage />;
      return (
        <DeskPage
          mode="verdict"
          input={caseReport.input}
          verdict={caseReport.verdict}
          onNewCase={handleNewCase}
        />
      );
  }
}

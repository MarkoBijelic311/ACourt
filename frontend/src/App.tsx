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

  async function handleFileCase(input: CaseInput) {
    setPage("loading");
    const report = await runCase(input);
    setCaseReport(report);
    setPage("analysis");
  }

  function handleNewCase() {
    setCaseReport(null);
    setPage("form");
  }

  switch (page) {
    case "form":
      return <DeskPage mode="form" onFileCase={handleFileCase} />;

    case "loading":
      return <LoadingPage />;

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

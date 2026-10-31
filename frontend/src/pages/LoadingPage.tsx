import CourtLoader from "../components/CourtLoader";

export default function LoadingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--walnut-950)" }}>
      <CourtLoader active text="The agents are reviewing the case…" />
    </div>
  );
}

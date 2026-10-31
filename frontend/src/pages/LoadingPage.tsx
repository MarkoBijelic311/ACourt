import CourtLoader from "../components/CourtLoader";

interface LoadingPageProps {
  text?: string;
}

export default function LoadingPage({ text = "The agents are reviewing the case…" }: LoadingPageProps) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--walnut-950)" }}>
      <CourtLoader active text={text} />
    </div>
  );
}

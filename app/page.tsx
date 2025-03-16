import { Suspense } from "react";
import { Workflow } from "./components/workflow";
import { Header } from "./components/header";

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Header />
      <Workflow />
    </Suspense>
  );
}

import { CheckCircle2 } from "lucide-react";

export const WorkspaceTips = ({ title = "Before You Start", tips = [] }) => (
  <aside className="workspace-tips">
    <h2>{title}</h2>
    <div className="workspace-tip-list">
      {tips.map((tip) => (
        <div className="workspace-tip" key={tip}>
          <CheckCircle2 size={18} />
          <span>{tip}</span>
        </div>
      ))}
    </div>
  </aside>
);

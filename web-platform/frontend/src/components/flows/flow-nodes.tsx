"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  Play,
  Ear,
  GitFork,
  Users,
  Code,
  MessageSquare,
  Flag,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Base node wrapper
interface BaseNodeProps {
  children: React.ReactNode;
  selected?: boolean;
  className?: string;
  color?: string;
}

function BaseNode({ children, selected, className, color }: BaseNodeProps) {
  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border-2 bg-background shadow-sm min-w-[180px]",
        "transition-all duration-200",
        selected ? "border-primary shadow-md" : "border-muted",
        className
      )}
      style={{ borderColor: selected ? undefined : color }}
    >
      {children}
    </div>
  );
}

// Start Node
export const StartNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode selected={selected} color="#22c55e">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <Play className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <div className="font-medium text-sm">{data.label || "Start"}</div>
          <div className="text-xs text-muted-foreground">Entry point</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-green-500 !w-3 !h-3"
      />
    </BaseNode>
  );
});
StartNode.displayName = "StartNode";

// Listen Node
export const ListenNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode selected={selected} color="#8b5cf6">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-violet-500 !w-3 !h-3"
      />
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900">
          <Ear className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <div className="font-medium text-sm">{data.label || "Listen"}</div>
          <div className="text-xs text-muted-foreground">
            {data.event || "Event listener"}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-violet-500 !w-3 !h-3"
      />
    </BaseNode>
  );
});
ListenNode.displayName = "ListenNode";

// Router Node
export const RouterNode = memo(({ data, selected }: NodeProps) => {
  const routes = data.routes || [];
  return (
    <BaseNode selected={selected} color="#f59e0b" className="min-w-[200px]">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-amber-500 !w-3 !h-3"
      />
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
          <GitFork className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <div className="font-medium text-sm">{data.label || "Router"}</div>
          <div className="text-xs text-muted-foreground">
            {routes.length} routes
          </div>
        </div>
      </div>
      <div className="flex justify-around mt-2">
        {routes.length > 0 ? (
          routes.map((route: string, idx: number) => (
            <Handle
              key={idx}
              type="source"
              position={Position.Bottom}
              id={route}
              className="!bg-amber-500 !w-3 !h-3"
              style={{ left: `${((idx + 1) / (routes.length + 1)) * 100}%` }}
            />
          ))
        ) : (
          <Handle
            type="source"
            position={Position.Bottom}
            className="!bg-amber-500 !w-3 !h-3"
          />
        )}
      </div>
    </BaseNode>
  );
});
RouterNode.displayName = "RouterNode";

// Crew Node
export const CrewNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode selected={selected} color="#3b82f6">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-500 !w-3 !h-3"
      />
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <div className="font-medium text-sm">{data.label || "Crew"}</div>
          <div className="text-xs text-muted-foreground">
            {data.crew_name || "Select crew"}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-500 !w-3 !h-3"
      />
    </BaseNode>
  );
});
CrewNode.displayName = "CrewNode";

// Function Node
export const FunctionNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode selected={selected} color="#06b6d4">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-cyan-500 !w-3 !h-3"
      />
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900">
          <Code className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div>
          <div className="font-medium text-sm">{data.label || "Function"}</div>
          <div className="text-xs text-muted-foreground">
            {data.function_name || "Custom code"}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-cyan-500 !w-3 !h-3"
      />
    </BaseNode>
  );
});
FunctionNode.displayName = "FunctionNode";

// Human Feedback Node
export const HumanFeedbackNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode selected={selected} color="#ec4899">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-pink-500 !w-3 !h-3"
      />
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900">
          <MessageSquare className="h-4 w-4 text-pink-600 dark:text-pink-400" />
        </div>
        <div>
          <div className="font-medium text-sm">
            {data.label || "Human Feedback"}
          </div>
          <div className="text-xs text-muted-foreground">
            {data.prompt ? "With prompt" : "Await input"}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-pink-500 !w-3 !h-3"
      />
    </BaseNode>
  );
});
HumanFeedbackNode.displayName = "HumanFeedbackNode";

// End Node
export const EndNode = memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode selected={selected} color="#ef4444">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-red-500 !w-3 !h-3"
      />
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
          <Flag className="h-4 w-4 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <div className="font-medium text-sm">{data.label || "End"}</div>
          <div className="text-xs text-muted-foreground">Exit point</div>
        </div>
      </div>
    </BaseNode>
  );
});
EndNode.displayName = "EndNode";

// Node type mapping
export const nodeTypes = {
  start: StartNode,
  listen: ListenNode,
  router: RouterNode,
  crew: CrewNode,
  function: FunctionNode,
  human_feedback: HumanFeedbackNode,
  end: EndNode,
};

// Node palette for drag and drop
export const nodePalette = [
  {
    type: "start",
    label: "Start",
    description: "Flow entry point",
    icon: Play,
    color: "#22c55e",
  },
  {
    type: "listen",
    label: "Listen",
    description: "Event listener",
    icon: Ear,
    color: "#8b5cf6",
  },
  {
    type: "router",
    label: "Router",
    description: "Conditional branching",
    icon: GitFork,
    color: "#f59e0b",
  },
  {
    type: "crew",
    label: "Crew",
    description: "Execute a crew",
    icon: Users,
    color: "#3b82f6",
  },
  {
    type: "function",
    label: "Function",
    description: "Custom Python code",
    icon: Code,
    color: "#06b6d4",
  },
  {
    type: "human_feedback",
    label: "Human Feedback",
    description: "Wait for user input",
    icon: MessageSquare,
    color: "#ec4899",
  },
  {
    type: "end",
    label: "End",
    description: "Flow exit point",
    icon: Flag,
    color: "#ef4444",
  },
];

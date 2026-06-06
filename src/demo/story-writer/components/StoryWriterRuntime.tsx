import { useContext, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectLinkedIds,
  selectNode,
  type RootState,
} from "../../../graph/selectors";
import { ChatbotConfigContext } from "../../chatbot/components/ChatbotConfigContext";
import type { AppDispatch } from "../../store";
import { generateStoryGraph } from "../storyGeneration";

export function StoryWriterRuntime({ nodeId }: { nodeId: string }) {
  const dispatch = useDispatch<AppDispatch>();
  const config = useContext(ChatbotConfigContext);
  const targetId = useSelector(
    (s: RootState) => selectLinkedIds(s, nodeId, "target")[0] ?? null,
  );
  const writer = useSelector((s: RootState) =>
    targetId ? selectNode(s, targetId) : null,
  );
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!targetId || !writer) return;
    if (writer.status !== "idle") return;
    const runKey = `${targetId}:${Number(writer.generationNonce ?? 0)}`;
    if (startedFor.current === runKey) return;

    startedFor.current = runKey;
    void generateStoryGraph({
      dispatch,
      writerId: targetId,
      runId: runKey.replace(":", "-run-"),
      prompt: String(writer.prompt ?? ""),
      responder: config.responder,
      responderName: config.responderName,
    });
  }, [config.responder, config.responderName, dispatch, targetId, writer]);

  return null;
}

"use client";

import { useEffect, useRef, useState } from "react";

const SIDEBAR_TRANSITION_MS = 300;
const DEFAULT_SIDEBAR_WIDTH = 420;
const MIN_SIDEBAR_WIDTH = 320;
const MAX_SIDEBAR_WIDTH = 720;

/**
 * State + drag/keyboard handlers for the resizable desktop detail sidebar.
 * `focusedGame` drives the open/close animation and which game is shown;
 * the hook renders nothing itself, so callers stay free to place the
 * mobile inline panel and the desktop <aside> wherever fits their layout.
 */
export function useResizableSidebar(focusedGame) {
  const [sidebarGame, setSidebarGame] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeTimeoutRef = useRef(null);

  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef({ startX: 0, startWidth: DEFAULT_SIDEBAR_WIDTH });

  useEffect(() => {
    if (focusedGame) {
      clearTimeout(closeTimeoutRef.current);
      setSidebarGame(focusedGame);
      // Two rAFs so the browser paints the closed (0-width) state first,
      // then the width transition actually has something to animate from.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setSidebarOpen(true)),
      );
    } else {
      setSidebarOpen(false);
      closeTimeoutRef.current = setTimeout(
        () => setSidebarGame(null),
        SIDEBAR_TRANSITION_MS,
      );
    }
    return () => clearTimeout(closeTimeoutRef.current);
  }, [focusedGame]);

  function clampSidebarWidth(width) {
    const viewportCap =
      typeof window !== "undefined" ? window.innerWidth * 0.8 : MAX_SIDEBAR_WIDTH;
    return Math.min(MAX_SIDEBAR_WIDTH, viewportCap, Math.max(MIN_SIDEBAR_WIDTH, width));
  }

  function handleResizeStart(e) {
    e.preventDefault();
    resizeStartRef.current = { startX: e.clientX, startWidth: sidebarWidth };
    setIsResizing(true);
  }

  // Drag tracking lives in an effect scoped to `isResizing` so the
  // document-level listeners are only attached mid-drag and always
  // cleaned up when it ends.
  useEffect(() => {
    if (!isResizing) return;

    function handleMouseMove(e) {
      // The handle sits on the left edge of the sidebar, so dragging left
      // (negative clientX delta) should grow the sidebar.
      const delta = resizeStartRef.current.startX - e.clientX;
      setSidebarWidth(clampSidebarWidth(resizeStartRef.current.startWidth + delta));
    }

    function handleMouseUp() {
      setIsResizing(false);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  return {
    sidebarGame,
    sidebarOpen,
    sidebarWidth,
    isResizing,
    handleResizeStart,
    MIN_SIDEBAR_WIDTH,
    MAX_SIDEBAR_WIDTH,
  };
}
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
// Import MemoryTestApp if you want to use it instead
// import MemoryTestApp from "./MemoryTestApp";

const domNode = document.getElementById("root");
const root = createRoot(domNode);

// Use App for memlab testing (toggle mount/unmount)
root.render(<App />);

// Or use MemoryTestApp for interactive browser-based testing
// root.render(<MemoryTestApp />);

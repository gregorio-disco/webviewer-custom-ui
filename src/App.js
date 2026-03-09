import React, { useRef, useState, useEffect } from "react";
import "./App.css";

const Internal = () => {
  const viewer = useRef(null);
  const scrollView = useRef(null);

  // if using a class, equivalent of componentDidMount
  useEffect(() => {
    let Core = window.Core;
    let documentViewer = null;

    try {
      // Set Core configuration only once
      if (!window.__coreConfigured) {
        Core.setWorkerPath("/webviewer");
        Core.disableEmbeddedJavaScript();
        Core.setCustomFontURL("");
        window.__coreConfigured = true;
      }

      documentViewer = new Core.DocumentViewer();
      documentViewer.setScrollViewElement(scrollView.current);
      documentViewer.setViewerElement(viewer.current);
      documentViewer.loadDocument("/files/demo.pdf");
    } catch (error) {
      console.error("Error during WebViewer initialization:", error);
    }

    return () => {
      // Proper cleanup sequence for PDFtron WebViewer v11+
      try {
        // Only call unmount - this handles all cleanup internally
        // dispose() may trigger WorkerManager errors in v11+
        if (documentViewer && typeof documentViewer.unmount === 'function') {
          documentViewer.unmount();
        }

        // Clear refs to help with garbage collection
        scrollView.current = null;
        viewer.current = null;
      } catch (error) {
        console.error("Error during WebViewer cleanup:", error);
      }
    };
  }, []);

  return (
    <div className="App">
      <div className="viewer">
        <div id="main-column">
          <div className="flexbox-container" id="scroll-view" ref={scrollView}>
            <div id="viewer" ref={viewer}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="app-shell">
      <button id="toggleViewer" onClick={() => setIsVisible((state) => !state)}>
        Toggle viewer
      </button>
      {isVisible ? <Internal /> : null}
    </div>
  );
};

export default App;

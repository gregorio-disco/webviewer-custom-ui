import React, { useRef, useState, useEffect } from "react";
import "./App.css";

const Internal = () => {
  const viewer = useRef(null);
  const scrollView = useRef(null);

  // if using a class, equivalent of componentDidMount
  useEffect(() => {
    let Core = window.Core;
    Core.setWorkerPath("/webviewer");
    Core.disableEmbeddedJavaScript();
    Core.setCustomFontURL("");

    let documentViewer = new Core.DocumentViewer();
    documentViewer.setScrollViewElement(scrollView.current);
    documentViewer.setViewerElement(viewer.current);
    documentViewer.loadDocument("/files/demo.pdf");

    return () => {
      if (documentViewer.getDocument()) {
        documentViewer.getDocument().unloadResources();
      }
      documentViewer.closeDocument().then(() => {
        documentViewer.dispose();

        scrollView.current = null;
        viewer.current = null;
        documentViewer = null;
        Core = null;
      });
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

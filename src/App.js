import "./App.css";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SectionFilling from "./page/SectionFilling/SectionFilling";
import SingleFilling from "./page/SingleFilling/SingleFilling";
import ImportExcel from "./page/ImportExcel/ImportExcel";
import Home from "./page/Home/Home";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/SectionFilling" element={<SectionFilling />} />
          <Route path="/SingleFilling" element={<SingleFilling />} />
          <Route path="/ImportExcel" element={<ImportExcel />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

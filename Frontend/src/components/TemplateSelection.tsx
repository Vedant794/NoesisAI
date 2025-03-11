import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Generator from "./Generator";
import FrontendGenerator from "./FrontendGenerator";
import { BACKEND_URL } from "../config";

function TemplateSelection() {
  const [template, setTemplate] = useState<String>("");
  const location = useLocation();
  const prompt = location.state?.prompt || "";

  async function main() {
    try {
      const response = await axios.post(`${BACKEND_URL}/template`, {
        template: prompt,
      });
      setTemplate(response.data.message);
    } catch (error) {
      console.log(error);
      throw new Error("Error occur in template finding");
    }
  }
  useEffect(() => {
    main();
  }, []);

  return <>{template === "frontend" ? <FrontendGenerator /> : <Generator />}</>;
}

export default TemplateSelection;

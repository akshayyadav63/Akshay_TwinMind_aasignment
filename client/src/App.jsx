import { useState } from "react";
import axios from "axios";

export default function App() {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");

  const ask = async () => {
    const res = await axios.post("http://localhost:3001/query", { query: q });
    setA(res.data.answer);
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Second Brain</h2>

      <textarea value={q} onChange={e => setQ(e.target.value)} />
      <br />
      <button onClick={ask}>Ask</button>

      <pre>{a}</pre>
    </div>
  );
}

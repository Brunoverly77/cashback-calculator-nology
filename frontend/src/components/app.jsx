import { useState, useEffect } from "react";
import axios from "axios";
import './app.css';

const API_URL = "https://cashback-calculator-nology.onrender.com";

const IconeLixeira = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

function App() {
  const [valorCompra, setValorCompra] = useState("");
  const [cupom, setCupom] = useState("");
  const [isVip, setIsVip] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [aquecendo, setAquecendo] = useState(true);
  const [deletando, setDeletando] = useState(null);

  useEffect(() => {
    const acordarServidor = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/historico`, { timeout: 30000 });
        setHistorico(response.data);
      } catch (error) {
        console.warn("Servidor ainda acordando...", error);
      } finally {
        setAquecendo(false);
      }
    };
    acordarServidor();
  }, []);

  const carregarHistorico = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/historico`);
      setHistorico(response.data);
    } catch (error) {
      console.error("Erro ao carregar histórico", error);
    }
  };

  const deletarItem = async (id) => {
    setDeletando(id);
    try {
      await axios.delete(`${API_URL}/api/historico/${id}`);
      setHistorico((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const status = error.response?.status;
      if (status === 404) {
        // Item não existe mais no servidor — remove localmente mesmo assim
        setHistorico((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert("Não foi possível apagar. Tente novamente.");
      }
    } finally {
      setDeletando(null);
    }
  };

  const enviarParaBackend = async () => {
    const valor = parseFloat(valorCompra);
    const desc = parseFloat(cupom);

    if (!valorCompra || !cupom) {
      alert("Por favor, preencha o valor da compra e o cupom antes de calcular!");
      return;
    }
    if (valor <= 0 || desc < 0 || desc > 100) {
      alert("Valor inválido! O valor da compra deve ser positivo e o cupom entre 0 e 100.");
      return;
    }

    setCarregando(true);
    setResultado(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/calcular`,
        { valor_bruto: valor, desconto_percentual: desc, eh_vip: isVip },
        { timeout: 60000 }
      );
      setResultado(response.data);
      await carregarHistorico();
    } catch (error) {
      if (error.code === "ECONNABORTED") {
        alert("O servidor demorou muito para responder. Tente novamente em instantes!");
      } else {
        alert("Erro ao conectar com o Backend. Verifique se o servidor está rodando.");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="container">
      <h2>Calculadora de Cashback</h2>

      {aquecendo && (
        <div className="aviso-aquecendo">
          ⏳ Conectando ao servidor, aguarde alguns segundos...
        </div>
      )}

      <div className="input-group">
        <input
          type="number"
          placeholder="Valor da Compra (R$)"
          value={valorCompra}
          min="0"
          onChange={(e) => setValorCompra(e.target.value)}
        />
      </div>
      <div className="input-group">
        <input
          type="number"
          placeholder="% do Cupom (0–100)"
          value={cupom}
          min="0"
          max="100"
          onChange={(e) => setCupom(e.target.value)}
        />
      </div>
      <div className="checkbox-group">
        <input
          type="checkbox"
          id="vip"
          checked={isVip}
          onChange={(e) => setIsVip(e.target.checked)}
        />
        <label htmlFor="vip">Cliente VIP</label>
      </div>

      <button onClick={enviarParaBackend} disabled={carregando || aquecendo}>
        {carregando ? "⏳ Calculando..." : "Calcular Agora"}
      </button>

      {resultado && (
        <div className="resultado-box">
          <p>Valor Final: <strong>R$ {resultado.valor_final}</strong></p>
          <p>Cashback: <strong className="valor-destaque">R$ {resultado.cashback}</strong></p>
        </div>
      )}

      <div className="historico-secao">
        <h3>Seu Histórico (por IP)</h3>
        {historico.length === 0 ? (
          <p style={{ color: "#888", fontSize: "14px" }}>Nenhum cálculo registrado ainda.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Valor Bruto</th>
                <th>Cashback</th>
                <th className="col-acao"></th>
              </tr>
            </thead>
            <tbody>
              {historico.map((item) => (
                <tr key={item.id}>
                  <td>{item.tipo}</td>
                  <td>R$ {item.valor}</td>
                  <td>R$ {item.cashback}</td>
                  <td className="col-acao">
                    <button
                      className="btn-lixeira"
                      title="Apagar registro"
                      disabled={deletando === item.id}
                      onClick={() => deletarItem(item.id)}
                    >
                      {deletando === item.id ? "..." : <IconeLixeira />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
import { useState, useEffect } from "react";
import axios from "axios";
import './app.css';

function App() {
  const [valorCompra, setValorCompra] = useState("");
  const [cupom, setCupom] = useState("");
  const [isVip, setIsVip] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [historico, setHistorico] = useState([]);

  const carregarHistorico = async () => {
    try {
      const response = await axios.get("https://cashback-calculator-nology.onrender.com/api/historico");
      setHistorico(response.data);
    } catch (error) {
      console.error("Erro ao carregar histórico", error);
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, []);

  const enviarParaBackend = async () => {
    if (!valorCompra || !cupom) {
      alert("Por favor, preencha o valor da compra e o cupom antes de calcular!");
      return;
    }

    try {
      const response = await axios.post("https://cashback-calculator-nology.onrender.com/api/calcular", {
        valor_bruto: valorCompra,
        desconto_percentual: cupom,
        eh_vip: isVip,
      });
      setResultado(response.data);
      carregarHistorico(); 
    } catch (error) {
      alert("Erro ao conectar com o Backend. Verifique se o Python está rodando!");
    }
  };

  return (
    <div className="container">
      <h2>Calculadora de Cashback</h2>
      
      <div className="input-group">
        <input type="number" placeholder="Valor da Compra (R$)" value={valorCompra} onChange={(e) => setValorCompra(e.target.value)} />
      </div>
      <div className="input-group">
        <input type="number" placeholder="% do Cupom" value={cupom} onChange={(e) => setCupom(e.target.value)} />
      </div>
      <div className="checkbox-group">
        <input type="checkbox" id="vip" checked={isVip} onChange={(e) => setIsVip(e.target.checked)} />
        <label htmlFor="vip">Cliente VIP</label>
      </div>

      <button onClick={enviarParaBackend}>Calcular Agora</button>

      {resultado && (
        <div className="resultado-box">
          <p>Valor Final: <strong>R$ {resultado.valor_final}</strong></p>
          <p>Cashback: <strong className="valor-destaque">R$ {resultado.cashback}</strong></p>
        </div>
      )}

      <div className="historico-secao">
        <h3>Seu Histórico (por IP)</h3>
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Valor Bruto</th>
              <th>Cashback</th>
            </tr>
          </thead>
          <tbody>
            {historico.map((item, index) => (
              <tr key={index}>
                <td>{item.tipo}</td>
                <td>R$ {item.valor}</td>
                <td>R$ {item.cashback}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
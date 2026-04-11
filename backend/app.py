from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": "*"}})

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'cashback.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Consulta(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ip_usuario = db.Column(db.String(50))
    tipo_cliente = db.Column(db.String(20))
    valor_compra = db.Column(db.Float)
    cashback_calculado = db.Column(db.Float)

with app.app_context():
    db.create_all()

def get_client_ip():
    """Função auxiliar para capturar o IP real do usuário, ignorando proxies do Render."""
    ip_real = request.headers.get('X-Forwarded-For', request.remote_addr)
    if ip_real and ',' in ip_real:
        ip_real = ip_real.split(',')[0].strip()
    return ip_real

@app.route('/api/calcular', methods=['POST'])
def calcular():
    dados = request.json
    valor_bruto = float(dados.get('valor_bruto', 0))
    desconto_pct = float(dados.get('desconto_percentual', 0))
    eh_vip = dados.get('eh_vip', False)

    valor_final = valor_bruto * (1 - (desconto_pct / 100))
    cashback = valor_final * 0.05

    if eh_vip:
        cashback += (cashback * 0.10)

    if valor_final > 500:
        cashback *= 2

    ip_usuario = get_client_ip()
    
    nova_consulta = Consulta(
        ip_usuario=ip_usuario,
        tipo_cliente="VIP" if eh_vip else "Normal",
        valor_compra=valor_bruto,
        cashback_calculado=round(cashback, 2)
    )
    db.session.add(nova_consulta)
    db.session.commit()

    return jsonify({
        "valor_final": round(valor_final, 2),
        "cashback": round(cashback, 2)
    })

@app.route('/api/historico', methods=['GET'])
def obter_historico():
    ip_usuario = get_client_ip()
    consultas = Consulta.query.filter_by(ip_usuario=ip_usuario).all()
    
    resultado = []
    for c in consultas:
        resultado.append({
            "tipo": c.tipo_cliente,
            "valor": c.valor_compra,
            "cashback": c.cashback_calculado
        })
    return jsonify(resultado)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
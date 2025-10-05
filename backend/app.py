from flask import Flask
from flask_cors import CORS
from routes.data_routes import data_bp
from routes.insights_routes import insights_bp
from routes.feature_routes import features_bp
from routes.model_scores_routes import model_scores_bp
from routes.model_routes import model_bp



app = Flask(__name__)
CORS(app)

app.register_blueprint(data_bp, url_prefix="/api")
app.register_blueprint(insights_bp, url_prefix="/api")
app.register_blueprint(features_bp, url_prefix="/api/features")
app.register_blueprint(model_scores_bp, url_prefix="/api/model_metrics")
app.register_blueprint(model_bp, url_prefix="/api/models")


@app.route("/")
def home():
    return {"message": "Flask backend for Azure Demand Project is running!"}

if __name__ == "__main__":
    app.run(debug=True)

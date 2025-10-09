# Azure Resource Demand Forecasting Project

## 🌟 Overview
A machine learning-based solution for predicting Azure resource demand, combining classical ML, deep learning, and time series analysis to forecast CPU usage, storage utilization, and active user counts.

## 📂 Project Structure
```
e:\Infosys\Project
├── backend/                  # Flask API server
│   ├── routes/              # API route handlers
│   ├── models/              # Trained ML models
│   └── requirements.txt     # Python dependencies
├── frontend/                # React frontend
│   ├── src/                # React source code
│   └── package.json        # Node dependencies
├── Data/                   # Data storage
│   ├── Raw/               # Raw data files
│   ├── Processed/         # Cleaned data
│   └── Models/            # Model-specific data
├── Model/                 # Model training code
├── Notebooks/            # Jupyter notebooks
└── reports/             # Project documentation
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- Git
- Virtual Environment (recommended)

### Backend Setup

1. Create & activate Python virtual environment:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python -m venv venv
source venv/bin/activate
```

2. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Start Flask server:
```bash
python app.py
# Server runs on http://localhost:5000
```

### Frontend Setup

1. Install Node dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

### Data Pipeline Setup

1. Place raw data files in `Data/Raw/`:
   - azure_usage.csv
   - external_factors.csv

2. Run notebooks in order:
```bash
cd Notebooks
jupyter notebook
```
Execute:
1. Data_Loading.ipynb - Initial data loading
2. data_prep.ipynb - Data preprocessing
3. time_based.ipynb - Feature engineering

## 🔧 Model Training

1. Navigate to Model directory:
```bash
cd Model
```

2. Run training notebooks in order:
- models.ipynb - Base model development
- model.ipynb - Enhanced models
- backtest.ipynb - Model validation

## 🛠️ Development

### Backend Development
- Flask API with modular blueprints
- Routes in `backend/routes/`
- Models saved in `backend/models/`

### Frontend Development
- React + Vite
- Components in `frontend/src/components`
- Pages in `frontend/src/pages`
- API services in `frontend/src/services`

## 📊 Key Features
- Time series forecasting
- Multi-model comparison
- Feature engineering pipeline
- Model backtesting
- Interactive dashboards
- Real-time predictions

## 🔍 Monitoring & Maintenance
- Models automatically retrain on new data
- Performance metrics tracking
- Model drift detection
- Automated backtesting

## 💻 Technology Stack
- **Backend**: Flask, Python
- **Frontend**: React, Vite
- **ML/DL**: Scikit-learn, XGBoost, TensorFlow
- **Data**: Pandas, NumPy
- **Visualization**: Chart.js, Recharts


## 📝 License
MIT License

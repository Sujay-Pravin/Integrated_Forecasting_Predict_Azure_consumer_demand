import React, { useState, useEffect } from 'react';
import './RetrainingPage.css';
import { model_endpoints, fetchData } from '../../services/model_api';
import ChartCard from '../Dashboard/ChartCard';

const RetrainingPage = () => {
  const [retrainStatus, setRetrainStatus] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchRetrainStatus = async () => {
    try {
      const status = await fetchData(model_endpoints.model_retrain_status);
      setRetrainStatus(status);
    } catch (err) {
      console.error("Failed to fetch retrain status:", err);
      setError("Failed to fetch retrain status");
    }
  };

  const fetchComparison = async () => {
    try {
      const data = await fetchData(model_endpoints.model_retrain_compare);
      setComparison(data);
    } catch (err) {
      console.error("Failed to fetch comparison:", err);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleRetrain = async (force = false) => {
    try {
      setLoading(true);
      const endpoint = `${model_endpoints.model_retrain}${force ? '?force=true' : ''}`;
      const result = await fetch(`http://localhost:5000/api/${endpoint}`, { method: 'POST' });
      const data = await result.json();
      
      if (data.models_status && data.models_status.length > 0) {
        const successCount = data.models_status.filter(m => !m.error).length;
        showNotification(`Successfully retrained ${successCount} models`, 'success');
      } else {
        showNotification('No models were retrained', 'warning');
      }
      
      await fetchRetrainStatus();
      await fetchComparison();
    } catch (err) {
      console.error("Retrain failed:", err);
      showNotification('Retraining failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = async (force = false) => {
    try {
      setLoading(true);
      const endpoint = `${model_endpoints.model_switch}${force ? '?force=true' : ''}`;
      const result = await fetch(`http://localhost:5000/api/${endpoint}`, { method: 'POST' });
      const data = await result.json();
      
      if (data.switched_models && data.switched_models.length > 0) {
        showNotification(`Successfully switched ${data.switched_models.length} models`, 'success');
      } else {
        showNotification(data.message || 'No models were switched', 'info');
      }
      
      await fetchRetrainStatus();
    } catch (err) {
      console.error("Switch failed:", err);
      showNotification('Model switching failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchRetrainStatus();
      await fetchComparison();
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="retraining-page">
      <div className="page-header">
        <div>
          <h1>Model Retraining Dashboard</h1>
          <p className="subtitle">Monitor and manage model performance</p>
        </div>
        <div className="header-actions">
          <div className="refresh-info">
            <span className="refresh-icon">🔄</span>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {notification && (
        <div className={`notification ${notification.type}`}>
          <span className="notification-icon">
            {notification.type === 'success' ? '✅' : 
             notification.type === 'error' ? '❌' : 
             notification.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          {notification.message}
        </div>
      )}

      <div className="dashboard-grid-retrain">
        <section className="status-section dashboard-item">
          <h2>Models Status Overview</h2>
          <div className="status-grid">
            {retrainStatus?.models_status?.map((model) => (
              <div key={model.service} 
                   className={`status-card ${model.needs_retrain ? 'needs-retrain' : 'current'}`}>
                <span className={`status-badge ${model.needs_retrain ? 'warning' : 'success'}`}>
                  {model.needs_retrain ? '🔄 Update Needed' : '✓ Current'}
                </span>
                <div className="card-header">
                  <h3>{model.service.toUpperCase()}</h3>
                </div>
                <div className="card-content">
                  <p><span className="label">Last Trained:</span> {model.last_trained_date}</p>
                  <p><span className="label">Last Data:</span> {model.last_data_date}</p>
                  <p className="status-reason">{model.retrain_reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="actions-panel dashboard-item">
          <h2>Available Actions</h2>
          <div className="action-buttons">
            <button className="action-button primary" onClick={() => handleRetrain(false)} disabled={loading}>
              <span className="button-icon">🔄</span>
              Retrain Needed
            </button>
            <button className="action-button secondary" onClick={() => handleRetrain(true)} disabled={loading}>
              <span className="button-icon">⚡</span>
              Force Retrain
            </button>
            <button className="action-button primary" onClick={() => handleSwitch(false)} disabled={loading}>
              <span className="button-icon">↺</span>
              Switch If Better
            </button>
            <button className="action-button secondary" onClick={() => handleSwitch(true)} disabled={loading}>
              <span className="button-icon">⚠</span>
              Force Switch
            </button>
          </div>
        </aside>

        {comparison && (
          <section className="comparison-section dashboard-item">
            <h2>Performance Analysis</h2>
            <div className="comparison-grid">
              {comparison.comparisons?.map((comp) => (
                <ChartCard key={comp.target} title={`${comp.service.toUpperCase()} Comparison`} fitheight='fit-height'>
                  <div className="metrics-comparison">
                    <div className="metrics-group">
                      <h4>Original Metrics</h4>
                      <p>MAE: {comp.original_metrics.MAE.toFixed(4)}</p>
                      <p>RMSE: {comp.original_metrics.RMSE.toFixed(4)}</p>
                      <p>MAPE: {comp.original_metrics.MAPE.toFixed(4)}%</p>
                    </div>
                    <div className="metrics-group">
                      <h4>Retrained Metrics</h4>
                      <p>MAE: {comp.retrained_metrics.MAE.toFixed(4)}</p>
                      <p>RMSE: {comp.retrained_metrics.RMSE.toFixed(4)}</p>
                      <p>MAPE: {comp.retrained_metrics.MAPE.toFixed(4)}%</p>
                    </div>
                    <div className="improvement-summary">
                      <h4>Improvements</h4>
                      <p>Metrics Improved: {comp.improvement_summary.metrics_improved}/{comp.improvement_summary.total_metrics}</p>
                      <p>Improvement Rate: {comp.improvement_summary.percent_improved}%</p>
                      <p className={`overall-status ${comp.improvements.Overall === 'improved' ? 'improved' : 'not-improved'}`}>
                        Overall: {comp.improvements.Overall}
                      </p>
                    </div>
                  </div>
                </ChartCard>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default RetrainingPage;

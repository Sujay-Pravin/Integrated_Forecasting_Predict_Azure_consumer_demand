# 🚀 Updates: Storage Efficiency Features

## 📊 New Dataset Columns in `insights.csv`
- **`storage_allocated`** → Maximum storage used by each `(region, resource_type)` across the dataset.  
- **`storage_efficiency`** → Ratio of actual usage vs allocated storage (in %), showing how efficiently resources are utilized.  

---

## 🌐 New API Endpoints
New routes were created for the following in the Flask backend:
 
- Top regions ranked by efficiency.  
- Monthly peak storage efficiency values.  
- Regional stats including efficiency mean, max, std deviation.  
- Compare efficiency on holidays vs non-holidays.  
- Quick summary with average, peak, and std deviation of efficiency in regions.  

---

## 📈 Frontend Visualizations
Our React dashboard now includes efficiency-aware charts:

- **Holiday Impact Chart** → Compares storage usage vs storage efficiency on holidays vs working days.  
- **Regional Comparison Chart** → Toggles between CPU/Storage/Users view and an efficiency-focused view:
  - Efficiency Mean (%)
  - Efficiency Max (%)
  - Efficiency Std Dev (%) for context  
- **Peak Efficiency Chart** → Highlights maximum efficiency month by month.  
- **Top Regions by Efficiency** → Displays regions ranked in descending order of efficiency.  

Tooltips and axis labels automatically adapt to show `%` for efficiency metrics, ensuring clarity and consistency.  

---

## ✅ Benefits
- Detect **under-utilized storage** through low efficiency scores.  
- Identify **high-performing regions** that maximize allocated resources.  
- Understand **holiday vs working day storage behavior**.  
- Gain a balanced view of **resource usage and efficiency together**.  

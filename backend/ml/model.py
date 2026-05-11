"""
ML Pipeline:
  1. K-Means clustering (k=3) → High / Moderate / Low Poverty labels
  2. Random Forest classifier trained on the cluster labels
  3. Serialise model bundle to model.pkl
"""
import os
import pickle
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MinMaxScaler

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')


def _label_clusters(kmeans, feature_matrix, feature_cols):
    """Map cluster indices to poverty labels by MPI-score centroid ranking."""
    centers = kmeans.cluster_centers_
    # 'literacy_rate' is at index 0 — lower literacy centroid → higher poverty
    literacy_idx = feature_cols.index('literacy_rate')
    order = np.argsort(centers[:, literacy_idx])          # ascending literacy
    label_map = {order[0]: 'High Poverty',
                 order[1]: 'Moderate Poverty',
                 order[2]: 'Low Poverty'}
    return label_map


def train_and_save(df, feature_cols):
    """Train KMeans + RF, save bundle, return enriched DataFrame."""
    X = df[feature_cols].values

    # Normalise for clustering
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)

    # K-Means
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    cluster_ids = kmeans.fit_predict(X_scaled)
    label_map = _label_clusters(kmeans, X_scaled, feature_cols)
    cluster_labels = [label_map[c] for c in cluster_ids]

    df = df.copy()
    df['cluster_id']    = cluster_ids
    df['cluster_label'] = cluster_labels
    df['is_hotspot']    = (df['cluster_label'] == 'High Poverty').astype(int)

    # Random Forest
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_scaled, df['is_hotspot'].values)

    # Calculate predict_proba for all rows (probability of being a hotspot, class 1)
    proba = rf.predict_proba(X_scaled)
    df['hotspot_probability'] = [round(p[1] * 100, 1) for p in proba]
    
    # Extract feature importances for Explainable AI
    feature_importances = {col: round(imp * 100, 1) for col, imp in zip(feature_cols, rf.feature_importances_)}

    bundle = {
        'kmeans':       kmeans,
        'rf':           rf,
        'scaler':       scaler,
        'feature_cols': feature_cols,
        'label_map':    label_map,
        'feature_importances': feature_importances,
        'districts_df': df,
    }
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(bundle, f)

    print(f"Model saved -> {MODEL_PATH}")
    print(df[['district', 'cluster_label', 'mpi_score']].sort_values('mpi_score', ascending=False).to_string())
    return df, bundle


def load_bundle():
    if not os.path.exists(MODEL_PATH):
        # Auto-train on first load
        from .preprocess import preprocess
        df, feature_cols, _ = preprocess()
        _, bundle = train_and_save(df, feature_cols)
        return bundle
    with open(MODEL_PATH, 'rb') as f:
        return pickle.load(f)


def predict(input_dict):
    """Predict poverty label for a single district dict of feature values."""
    bundle = load_bundle()
    feature_cols = bundle['feature_cols']
    scaler       = bundle['scaler']
    rf           = bundle['rf']
    label_map    = bundle['label_map']

    X = np.array([[input_dict.get(c, 50.0) for c in feature_cols]])
    X_scaled = scaler.transform(X)

    cluster_id = bundle['kmeans'].predict(X_scaled)[0]
    hotspot    = int(rf.predict(X_scaled)[0])
    proba      = rf.predict_proba(X_scaled)[0].tolist()
    return {
        'cluster_label': label_map.get(cluster_id, 'Unknown'),
        'is_hotspot':    hotspot,
        'confidence':    round(max(proba) * 100, 1),
    }


if __name__ == '__main__':
    from preprocess import preprocess
    df, feature_cols, _ = preprocess()
    train_and_save(df, feature_cols)

import pandas as pd
import numpy as np
import os
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

def perform_pca():
    # Get the base directory and construct absolute paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    matches_path = os.path.join(base_dir, "data", "matches.parquet")
    players_path = os.path.join(base_dir, "data", "players.parquet")
    
    # Check if files exist
    if not os.path.exists(matches_path):
        raise FileNotFoundError(f"File not found: {matches_path}")
    if not os.path.exists(players_path):
        raise FileNotFoundError(f"File not found: {players_path}")
        
    matches_df = pd.read_parquet(matches_path)
    players_df = pd.read_parquet(players_path)

    merged_df = pd.merge(matches_df, players_df, on="game_id")
    filtered_df = merged_df[merged_df["num_players"] == 2]
    numeric_df = filtered_df.select_dtypes(include=[np.number])

    # Dropping any columns with NaN values
    numeric_df = numeric_df.dropna(axis=1)

    # Convert timedelta columns to numerical (seconds)
    for col in numeric_df.select_dtypes(include=['timedelta64']).columns:
        numeric_df[col] = numeric_df[col].dt.total_seconds()

    # Standardizing the data
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(numeric_df)

    # Performing PCA
    pca = PCA()
    pca.fit(scaled_data)

    # Convert NumPy arrays to Python lists for JSON serialization
    eigenvectors = pca.components_.tolist()
    explained_variance = pca.explained_variance_.tolist()
    explained_variance_ratio = pca.explained_variance_ratio_.tolist()
    
    # Also return column names for reference
    feature_names = numeric_df.columns.tolist()

    return {
        "eigenVectors": eigenvectors,
        "explainedVariance": explained_variance,
        "explainedVarianceRatio": explained_variance_ratio,
        "featureNames": feature_names
    }


def get_biplot_data(selected_dimentions):

    if isinstance(selected_dimentions, int):
        selected_dimentions = list(range(selected_dimentions + 1))
    elif not isinstance(selected_dimentions, list):
        selected_dimentions = [0, 1]

    base_dir = os.path.dirname(os.path.abspath(__file__))
    matches_path = os.path.join(base_dir, "data", "matches.parquet")
    players_path = os.path.join(base_dir, "data", "players.parquet")
    
    # Check if files exist
    if not os.path.exists(matches_path):
        raise FileNotFoundError(f"File not found: {matches_path}")
    if not os.path.exists(players_path):
        raise FileNotFoundError(f"File not found: {players_path}")
        
    matches_df = pd.read_parquet(matches_path)
    players_df = pd.read_parquet(players_path)

    merged_df = pd.merge(matches_df, players_df, on="game_id")
    filtered_df = merged_df[merged_df["num_players"] == 2]
    numeric_df = filtered_df.select_dtypes(include=[np.number])

    # Dropping any columns with NaN values
    numeric_df = numeric_df.dropna(axis=1)

    # Convert timedelta columns to numerical (seconds)
    for col in numeric_df.select_dtypes(include=['timedelta64']).columns:
        numeric_df[col] = numeric_df[col].dt.total_seconds()

    # Standardizing the data
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(numeric_df)

    # Performing PCA
    pca = PCA()
    pca_scores = pca.fit_transform(scaled_data)
    loadings = pca.components_.T 
    feature_names = numeric_df.columns.tolist()
    variance = pca.explained_variance_ratio_
    selected_dimensions = selected_dimentions
    original_data = numeric_df.values
    point_labels = numeric_df.index.tolist()

    biplot_data = {
    "pcScores": pca_scores[:, selected_dimensions].tolist(),
    "loadings": loadings[:, selected_dimensions].tolist(),
    "featureNames": feature_names,
    "variance": variance.tolist(),
    "selectedDimensions": selected_dimensions,
    "originalData": original_data.tolist(),
    "pointLabels": point_labels,
}

    return biplot_data
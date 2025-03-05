import pandas as pd
import numpy as np
import os
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

def perform_pca():
    # Get the base directory and construct absolute paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    merged_df_path = os.path.join(base_dir, "data", "merged_df.csv")
    merged_df = pd.read_csv(merged_df_path)
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
    
    # Calculate cumulative explained variance for Scree plot
    cumulative_variance_ratio = np.cumsum(pca.explained_variance_ratio_).tolist()
    
    # Also return column names for reference
    feature_names = numeric_df.columns.tolist()

    return {
        "eigenVectors": eigenvectors,
        "explainedVariance": explained_variance,
        "explainedVarianceRatio": explained_variance_ratio,
        "cumulativeVarianceRatio": cumulative_variance_ratio,
        "featureNames": feature_names,
        "screeData": {
            "components": list(range(1, len(explained_variance_ratio) + 1)),
            "explainedVarianceRatio": explained_variance_ratio,
            "cumulativeVarianceRatio": cumulative_variance_ratio
        }
    }


def get_biplot_data(selected_dimensions=None):
    # Default to first two dimensions if not specified
    if selected_dimensions is None:
        selected_dimensions = [0, 1, 2, 3, 4]
    elif isinstance(selected_dimensions, int):
        selected_dimensions = list(range(min(selected_dimensions + 1, 5)))
    elif not isinstance(selected_dimensions, list):
        selected_dimensions = [0, 1, 2, 3, 4]

    # Get the base directory and construct absolute path to file
    base_dir = os.path.dirname(os.path.abspath(__file__))
    merged_df_path = os.path.join(base_dir, "data", "merged_df.csv")
    merged_df = pd.read_csv(merged_df_path)
    
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
    
    # Generate point labels (can be customized)
    point_labels = [f"Point {i+1}" for i in range(len(pca_scores))]
    
    # Create original data as a list of dictionaries
    original_data = []
    for i, row in enumerate(numeric_df.values):
        data_point = {}
        for j, feature in enumerate(feature_names):
            data_point[feature] = row[j]
        original_data.append(data_point)

    biplot_data = {
        "pcScores": pca_scores.tolist(),
        "loadings": loadings.tolist(),
        "featureNames": feature_names,
        "variance": variance.tolist(),
        "selectedDimensions": selected_dimensions,
        "pointLabels": point_labels,
        "originalData": original_data
    }

    return biplot_data
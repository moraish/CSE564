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


def top_features(di):
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
    pca = PCA(n_components=di)  # Limit the components to <= di
    pca.fit(scaled_data)

    # Get the loadings (transpose components to get features in rows)
    loadings = pca.components_.T  
    
    # Weight loadings by explained variance for each component
    weighted_loadings = loadings * np.sqrt(pca.explained_variance_)
    
    # Sum of squared loadings for each feature
    squared_loadings = np.sum(weighted_loadings**2, axis=1)
    
    # Get the indices of the top 4 features with the highest squared sum of loadings
    top_indices = np.argsort(squared_loadings)[-4:][::-1]
    
    # Get the feature names (column names) of the top 4 features
    top_features = numeric_df.columns[top_indices].tolist()
    
    return top_features


def get_scatterplot_matrix_data(dimensions=2):
    """
    Creates data for a scatterplot matrix of the top 4 features identified by PCA.
    
    Args:
        dimensions (int): Number of PCA dimensions to consider for selecting top features
        
    Returns:
        dict: Data for scatterplot matrix including features and values
    """
    # Get the base directory and construct absolute paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    merged_df_path = os.path.join(base_dir, "data", "merged_df.csv")
    merged_df = pd.read_csv(merged_df_path)
    filtered_df = merged_df[merged_df["num_players"] == 2]
    
    # Get the top 4 features based on PCA
    features = top_features(dimensions)
    
    # Extract only the top features from the dataframe
    feature_data = filtered_df[features].copy()
    
    # Convert to appropriate format for frontend
    result = {
        "features": features,  # List of feature names
        "data": []  # Will contain data points
    }
    
    # Convert data to list of dictionaries (one per row)
    for _, row in feature_data.iterrows():
        data_point = {}
        for feature in features:
            value = row[feature]
            # Convert numpy types to Python native types for JSON serialization
            if isinstance(value, np.integer):
                value = int(value)
            elif isinstance(value, np.floating):
                value = float(value)
            data_point[feature] = value
        result["data"].append(data_point)
    
    # Calculate correlation matrix
    corr_matrix = feature_data.corr().to_dict(orient='index')
    result["correlation_matrix"] = corr_matrix
    
    return result


import pandas as pd
import numpy as np
import os
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans


def perform_pca():
    # Get the base directory and construct absolute paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    merged_df_path = os.path.join(base_dir, "data", "merged_df.csv")
    merged_df = pd.read_csv(merged_df_path)
    numeric_df = merged_df.select_dtypes(include=[np.number])

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
    
    numeric_df = merged_df.select_dtypes(include=[np.number])

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
    numeric_df = merged_df.select_dtypes(include=[np.number])

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
    
    # Get the top 4 features based on PCA
    features = top_features(dimensions)
    
    # Extract only the top features from the dataframe
    feature_data = merged_df[features].copy()
    
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

def get_pca_loadings(di):
    """
    Returns the loadings (weights) of each feature on each principal component.
    
    Args:
        di (int): Number of PCA dimensions to consider
        
    Returns:
        dict: Dictionary containing loadings and related data
    """
    # Get the base directory and construct absolute paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    merged_df_path = os.path.join(base_dir, "data", "merged_df.csv")
    merged_df = pd.read_csv(merged_df_path)
    numeric_df = merged_df.select_dtypes(include=[np.number])

    # Dropping any columns with NaN values
    numeric_df = numeric_df.dropna(axis=1)

    # Convert timedelta columns to numerical (seconds)
    for col in numeric_df.select_dtypes(include=['timedelta64']).columns:
        numeric_df[col] = numeric_df[col].dt.total_seconds()

    # Standardizing the data
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(numeric_df)

    # Performing PCA with specified number of components
    pca = PCA(n_components=min(di, len(numeric_df.columns)))
    pca.fit(scaled_data)

    # Get the loadings (transpose components to get features in rows)
    loadings = pca.components_.T
    
    # Weight loadings by explained variance
    weighted_loadings = loadings * np.sqrt(pca.explained_variance_)
    
    # Calculate squared sum of loadings for each feature
    # Only use the first 'di' components
    squared_loadings = np.sum(weighted_loadings[:, :di]**2, axis=1)
    
    # Get indices of features sorted by squared loadings
    sorted_indices = np.argsort(squared_loadings)[::-1]
    
    # Get top 4 features
    top_indices = sorted_indices[:4]
    top_features = numeric_df.columns[top_indices].tolist()
    top_loadings = squared_loadings[top_indices].tolist()
    
    # Create table data for frontend display
    table_data = []
    for i, (feature, loading) in enumerate(zip(top_features, top_loadings)):
        table_data.append({
            "rank": i+1,
            "feature": feature,
            "loading": round(loading, 4)
        })
    
    return {
        "allLoadings": loadings.tolist(),
        "squaredLoadings": squared_loadings.tolist(),
        "featureNames": numeric_df.columns.tolist(),
        "topFeatures": top_features,
        "topLoadingValues": top_loadings,
        "tableData": table_data,
        "explainedVariance": pca.explained_variance_ratio_.tolist()
    }





def perform_kmeans(n_clusters=3, dimensions=2):
    # Get the base directory and construct absolute paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    merged_df_path = os.path.join(base_dir, "data", "merged_df.csv")
    merged_df = pd.read_csv(merged_df_path)
    numeric_df = merged_df.select_dtypes(include=[np.number])

    # Dropping any columns with NaN values
    numeric_df = numeric_df.dropna(axis=1)

    # Convert timedelta columns to numerical (seconds)
    for col in numeric_df.select_dtypes(include=['timedelta64']).columns:
        numeric_df[col] = numeric_df[col].dt.total_seconds()

    # Standardizing the data
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(numeric_df)

    # Performing PCA with the specified number of dimensions
    pca = PCA(n_components=dimensions)
    pca_data = pca.fit_transform(scaled_data)

    # Using the Elbow Method to determine the best 'k' (still calculate this for the chart)
    inertia = []
    k_range = range(1, 11)  # Testing k from 1 to 10

    for k in k_range:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(pca_data)
        inertia.append(kmeans.inertia_)

    # Use the n_clusters passed from the frontend
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(pca_data)

    return {
        "pcaData": pca_data.tolist(),  # PCA-transformed data
        "clusterLabels": cluster_labels.tolist(),  # Assigned cluster for each point
        "elbowData": {
            "kValues": list(k_range),
            "inertia": inertia
        },
        "optimalK": n_clusters,  # Return the user-specified k
        "dimensions": dimensions  # Return the dimensions used
    }
import pandas as pd
import numpy as np
import os
import json
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.manifold import MDS
from sklearn.preprocessing import StandardScaler
from scipy.spatial.distance import pdist, squareform
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import LabelEncoder 
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

def get_scatterplot_matrix_data(dimensions=2, n_clusters=3):
    """
    Creates data for a scatterplot matrix of the top 4 features identified by PCA,
    including cluster assignments.
    
    Args:
        dimensions (int): Number of PCA dimensions to consider for selecting top features
        n_clusters (int): Number of clusters to create
        
    Returns:
        dict: Data for scatterplot matrix including features, values, and cluster assignments
    """
    # Get the base directory and construct absolute paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    merged_df_path = os.path.join(base_dir, "data", "merged_df.csv")
    merged_df = pd.read_csv(merged_df_path)
    
    # Get the top 4 features based on PCA
    features = top_features(dimensions)
    
    # Extract only the top features from the dataframe
    feature_data = merged_df[features].copy()
    
    # Perform clustering on these features
    # Standardizing the feature data
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(feature_data)
    
    # Apply K-means clustering
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(scaled_features)
    
    # Convert to appropriate format for frontend
    result = {
        "features": features,  # List of feature names
        "data": [],  # Will contain data points
        "clusterCenters": []  # Will contain cluster centers
    }
    
    # Convert data to list of dictionaries (one per row)
    for i, row in enumerate(feature_data.iterrows()):
        _, row_data = row
        data_point = {}
        for feature in features:
            value = row_data[feature]
            # Convert numpy types to Python native types for JSON serialization
            if isinstance(value, np.integer):
                value = int(value)
            elif isinstance(value, np.floating):
                value = float(value)
            data_point[feature] = value
        
        # Add cluster assignment
        data_point["cluster"] = int(cluster_labels[i])
        result["data"].append(data_point)
    
    # Add cluster centers
    centers = kmeans.cluster_centers_
    for i, center in enumerate(centers):
        center_point = {"cluster": i}
        for j, feature in enumerate(features):
            center_point[feature] = float(center[j])
        result["clusterCenters"].append(center_point)
    
    # Calculate correlation matrix
    corr_matrix = feature_data.corr().to_dict(orient='index')
    result["correlation_matrix"] = corr_matrix
    
    return result


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


def compute_mds_json(cluster_labels=None, find_optimal=False):
    """
    Computes MDS plots for data points and variables.
    
    Parameters:
    cluster_labels (pd.Series or list, optional): Cluster labels for coloring points.
    find_optimal (bool): Whether to find the optimal number of clusters (defaults to False).
    
    Returns:
    dict: A dictionary containing MDS coordinates for data points and variables in JSON format.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    merged_df_path = os.path.join(base_dir, "data", "merged_df.csv")
    df = pd.read_csv(merged_df_path)
    
    # Select numeric columns only
    df = df.select_dtypes(include=[np.number])
    
    # Dropping any columns with NaN values
    df = df.dropna(axis=1)
    
    # Standardize the data
    scaler = StandardScaler()
    df_scaled = scaler.fit_transform(df)
    
    # (a) Data MDS plot using Euclidean distance
    data_dist = squareform(pdist(df_scaled, metric='euclidean'))
    mds_data = MDS(n_components=2, dissimilarity='precomputed', random_state=42)
    data_coords = mds_data.fit_transform(data_dist)
    
    # Determine optimal number of clusters if requested
    optimal_k = None
    if find_optimal:
        # Calculate silhouette scores for different k values
        
        silhouette_scores = []
        k_range = range(2, 11)  # Test 2-10 clusters
        
        for k in k_range:
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = kmeans.fit_predict(data_coords)  # Cluster in MDS space
            
            # Skip if there's only one cluster or some clusters are empty
            if len(np.unique(labels)) < 2:
                silhouette_scores.append(-1)
                continue
                
            # Calculate silhouette score
            score = silhouette_score(data_coords, labels)
            silhouette_scores.append(score)
        
        # Find k with highest silhouette score
        if silhouette_scores:
            optimal_k = k_range[np.argmax(silhouette_scores)]
            
            # Use the optimal number of clusters
            kmeans = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
            cluster_labels = kmeans.fit_predict(data_coords)
    
    data_json = [{
        "x": float(data_coords[i, 0]),
        "y": float(data_coords[i, 1]),
        "cluster": int(cluster_labels[i]) if cluster_labels is not None else None
    } for i in range(len(df))]
    
    # (b) Variable MDS plot using (1 - |correlation|) distance
    corr_matrix = df.corr().abs()  # Absolute correlation
    var_dist = 1 - corr_matrix
    var_dist[var_dist < 0] = 0  # Ensure non-negative distances
    
    mds_var = MDS(n_components=2, dissimilarity='precomputed', random_state=42)
    var_coords = mds_var.fit_transform(var_dist)
    
    var_json = [{
        "x": float(var_coords[i, 0]),
        "y": float(var_coords[i, 1]),
        "variable": df.columns[i]
    } for i in range(len(df.columns))]
    
    result = {
        "data_mds": data_json, 
        "variable_mds": var_json
    }
    
    # Add optimal clustering info if available
    if find_optimal and optimal_k:
        result["optimal_k"] = optimal_k
        
    return json.dumps(result, indent=4)


def compute_parallel_coordinates_json():
    """
    Converts a dataframe into a format suitable for parallel coordinates plotting.
    Handles both numerical and categorical variables.
    
    Returns:
    dict: A dictionary with processed data and axis information
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    merged_df_path = os.path.join(base_dir, "data", "merged_df.csv")
    df = pd.read_csv(merged_df_path)

    # Replace inf, -inf with large finite values and NaN with None
    df = df.replace([np.inf, -np.inf], [1.0e+308, -1.0e+308])
    # Remove 'Name' column if it exists
    if 'Name' in df.columns:
        df = df.drop(columns=['Name', 'POS'])
    
    df_processed = df.copy()
    encoders = {}
    
    # Create axis information for each column
    axes = []
    for col in df.columns:
        axis_info = {
            "name": col,  # Original column name
            "type": "categorical" if df[col].dtype == "object" or df[col].dtype == "category" else "numerical"
        }
        
        # Add range information for numerical columns
        if axis_info["type"] == "numerical":
            axis_info["min"] = float(df[col].min()) if np.isfinite(df[col].min()) else None
            axis_info["max"] = float(df[col].max()) if np.isfinite(df[col].max()) else None
        
        axes.append(axis_info)
    
    # Process categorical variables
    for col in df.select_dtypes(include=['object', 'category']).columns:
        encoder = LabelEncoder()
        df_processed[col] = encoder.fit_transform(df[col].fillna('missing'))
        # Convert NumPy values to native Python types
        encoders[col] = {str(k): int(v) for k, v in zip(encoder.classes_, encoder.transform(encoder.classes_))}
    
    # Convert DataFrame to records and ensure all values are JSON serializable
    records = []
    for record in df_processed.to_dict(orient='records'):
        # Convert any NumPy types to native Python types
        clean_record = {}
        for key, value in record.items():
            if pd.isna(value):
                clean_record[key] = None
            elif isinstance(value, (np.integer, np.int64, np.int32)):
                clean_record[key] = int(value)
            elif isinstance(value, (np.floating, np.float64, np.float32)):
                if np.isfinite(value):
                    clean_record[key] = float(value)
                else:
                    clean_record[key] = None
            elif isinstance(value, np.bool_):
                clean_record[key] = bool(value)
            elif isinstance(value, (np.ndarray, list)):
                clean_record[key] = [
                    None if pd.isna(x) else
                    int(x) if isinstance(x, np.integer) else 
                    float(x) if isinstance(x, np.floating) and np.isfinite(x) else
                    bool(x) if isinstance(x, np.bool_) else x 
                    for x in value
                ]
            else:
                clean_record[key] = value
        records.append(clean_record)
    
    return {
        "records": records,
        "axes": axes,
        "encoders": encoders
    }
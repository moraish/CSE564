from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from services import perform_pca, get_biplot_data, top_features, get_scatterplot_matrix_data, get_pca_loadings, perform_kmeans

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/eigenValues")
async def get_eigen_values():
    result = perform_pca()
    return {"explained_variance_ratio": result["explainedVarianceRatio"]}

@app.get("/biplot")
async def get_biplot(dimensions: Optional[List[int]] = Query(None, description="List of dimensions to include in the biplot")):
    # Pass dimensions directly to get_biplot_data, which now handles defaults appropriately
    result = get_biplot_data(dimensions)
    return {"biplot": result}

@app.get("/top_features")
async def get_top_features(dimensions: int = Query(2, description="Number of PCA dimensions to consider")):
    features = top_features(dimensions)
    return {"top_features": features}

@app.get("/scatterplot_matrix")
async def get_scatterplot_matrix(
    dimensions: int = Query(2, description="Number of PCA dimensions to consider"),
    n_clusters: int = Query(3, description="Number of clusters to create")
):
    result = get_scatterplot_matrix_data(dimensions, n_clusters)
    return {"scatterplot_matrix": result}


@app.get("/pca_loadings")
async def get_loadings(dimensions: int = Query(None, description="Number of PCA dimensions to return (defaults to all)")):
    loadings = get_pca_loadings(dimensions)
    return {"loadings": loadings}

@app.get("/kmeans")
def kmeans_endpoint(clusters: int = 3, dimensions: int = 2):
    result = perform_kmeans(n_clusters=clusters, dimensions=dimensions)
    return result

@app.get("/")
async def root():
    return {"message": "PCA Backend is running 🚀"}
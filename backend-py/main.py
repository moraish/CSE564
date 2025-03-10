from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from services import perform_pca, get_biplot_data, top_features, get_scatterplot_matrix_data

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
async def get_scatterplot_matrix(dimensions: int = Query(2, description="Number of PCA dimensions to consider")):
    result = get_scatterplot_matrix_data(dimensions)
    return {"scatterplot_matrix": result}

@app.get("/")
async def root():
    return {"message": "PCA Backend is running 🚀"}
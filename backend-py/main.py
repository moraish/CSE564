from fastapi import FastAPI, Query
from services import perform_pca, get_biplot_data
from typing import List, Optional


app = FastAPI()

@app.get("/eigenValues")
async def get_eigen_values():
    result = perform_pca()
    return {"eigenValues": result["eigenVectors"]}

@app.get("/biplot")
async def get_biplot(dimensions: Optional[List[int]] = Query(None, description="List of dimensions to include in the biplot")):
    if dimensions is None:
        dimensions = [0, 1]  # Default to first two dimensions
    result = get_biplot_data(dimensions)
    return {"biplot": result}
# http://127.0.0.1:8000/biplot?dimensions=2


@app.get("/")
async def root():
    return {"message": "PCA Backend is running 🚀"}
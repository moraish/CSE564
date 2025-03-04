const express = require('express');
const app = express();

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const cors = require('cors');

app.use(cors());

const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON
app.use(express.json());

// Default route
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Get all column names
app.get('/api/columns', (req, res) => {
    const csvFilePath = path.join(__dirname, '../backend/data', 'merged_df.csv');

    let columns = new Set(); // Use a Set to avoid duplicates

    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('headers', (headers) => {
            // console.log('Headers:', headers); // Log headers for debugging
            headers.forEach((header) => columns.add(header));
        })
        .on('data', (row) => {
            // console.log('Row:', row); // Log each row to ensure the file is being read
        })
        .on('end', () => {
            // console.log('Finished reading CSV.');
            res.json(Array.from(columns)); // Send the columns as a JSON array
        })
        .on('error', (err) => {
            // console.error('Error reading the CSV file:', err);
            res.status(500).send('Error reading the CSV file.');
        });

});

// Get data for multiple columns
app.get('/api/data/scatter', (req, res) => {
    const { x, y } = req.query;
    console.log("Scatter Data fetched!");
    const csvFilePath = path.join(__dirname, '../backend/data', 'merged_df.csv');
    if (!x || !y) {
        return res.status(400).json({ error: "Both x and y query parameters must be provided" });
    }

    const results = [];

    // Check if the file exists
    if (!fs.existsSync(csvFilePath)) {
        return res.status(404).json({ error: "CSV file not found" });
    }

    // Read and parse the CSV file
    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
            // Check if both columns exist in the current row
            if (row[x] !== undefined && row[y] !== undefined) {
                results.push({ [x]: row[x], [y]: row[y] });
            }
        })
        .on('end', () => {
            if (results.length === 0) {
                return res.status(404).json({ error: `Columns '${x}' and/or '${y}' not found or no data available` });
            }
            res.json(results);
        })
        .on('error', (err) => {
            console.error("Error reading CSV:", err);
            res.status(500).json({ error: "Error reading CSV file" });
        });
});

// Get data for one column
app.get('/api/data/:column', (req, res) => {
    const csvFilePath = path.join(__dirname, '../backend/data', 'merged_df.csv');
    const { column } = req.params;
    const results = [];

    // Check if the file exists
    if (!fs.existsSync(csvFilePath)) {
        return res.status(404).json({ error: "CSV file not found" });
    }

    // Read and parse the CSV file
    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
            if (row[column] !== undefined) {
                results.push(row[column]);
            }
        })
        .on('end', () => {
            if (results.length === 0) {
                return res.status(404).json({ error: `Column '${column}' not found` });
            }
            res.json({ column, data: results });
        })
        .on('error', (err) => {
            console.error("Error reading CSV:", err);
            res.status(500).json({ error: "Error reading CSV file" });
        });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


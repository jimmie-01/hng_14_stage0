const dotenv = require('dotenv');
const express = require('express');
const axios = require('axios');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors({
	origin: '*'
}));

// Error response helper function
const errorResponse = (res, statusCode, message) => {
	return res.status(statusCode).json({
		status: 'error',
		message
	});
};

// GET /api/classify
app.get('/api/classify', async (req, res) => {
	try {
		const { name } = req.query;

		// name validation
		if (!name) {
			return errorResponse(res, 400, 'Missing or empty name parameter');
		}

		if (typeof name !== 'string') {
			return errorResponse(res, 422, 'name must be a string');
		}

		const trimmedName = name.trim();

		if (!trimmedName) {
			return errorResponse(res, 400, 'Missing or empty name parameter');
		}

		// Call Genderize API
		const response = await axios.get('https://api.genderize.io', {
			params: { name: trimmedName},
			timeout: 4000 // 4s Safeguard
		});

		const { gender, probability, count } = response.data;

		// Edge case handling
		if (gender === null || count === 0) {
			return errorResponse(res, 422, 'No prediction available for the provided name');
		}

		// Processed data
		const sample_size = count;

		const is_confident = probability >= 0.7 && sample_size >= 100;

		const processed_at = new Date().toISOString();

		//success response
		return res.status(200).json({
			status: 'success',
			data: {
				name: trimmedName.toLowerCase(),
				gender,
				probability,
				sample_size,
				is_confident,
				processed_at
			}
		});
	} catch (error) {
		// Handle upstream errors
		if(error.response) {
			return errorResponse(res, 502, 'Upstream service error');
		}

		return errorResponse(res, 500, 'Internal server error');
	}
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

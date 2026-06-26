# Use an official Python lightweight image as the base
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install dependencies without caching to keep the image small
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire current directory (your app code) into the /app directory
COPY . /app

# Expose port 8000 so the outside world can communicate with FastAPI
EXPOSE 8000

# Define the startup command to run Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

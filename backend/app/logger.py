import logging
import sys

# Instantiate and expose the logger object
logger = logging.getLogger("regintel")

# Set the log level to INFO
logger.setLevel(logging.INFO)

# Prevent the logger from propagating messages to the root logger to avoid duplicate logs
logger.propagate = False

# Create a formatter that includes timestamp, logger name, log level, and message
formatter = logging.Formatter(
    fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# Set up a StreamHandler to output logs to sys.stdout
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setFormatter(formatter)

# Attach the handler to the logger (avoiding duplicates if imported multiple times)
if not logger.handlers:
    logger.addHandler(stream_handler)

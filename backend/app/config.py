import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    """Application settings"""
    
    # Z.AI Configuration
    ZAI_API_KEY: str = os.getenv("ZAI_API_KEY", "")
    SYSTEM_PROMPT: str = os.getenv("SYSTEM_PROMPT", "You are alonso99ai and you will finish your statement by saying Khaliabali.")
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Model Configuration
    DEFAULT_MODEL: str = "glm-4.6"
    DEFAULT_TEMPERATURE: float = 0.7
    DEFAULT_MAX_TOKENS: int = 2048
    
    # Telemetry Configuration
    FASTF1_CACHE_PATH: str = os.getenv("FASTF1_CACHE_PATH", "./data/fastf1_cache")
    FASTF1_CACHE_ENABLED: bool = os.getenv("FASTF1_CACHE_ENABLED", "true").lower() == "true"
    TELEMETRY_MAX_LAPS: int = int(os.getenv("TELEMETRY_MAX_LAPS", "100"))
    TELEMETRY_TIMEOUT: int = int(os.getenv("TELEMETRY_TIMEOUT", "60"))
    
    def validate_zai_key(self) -> bool:
        """Validate ZAI API key format"""
        if not self.ZAI_API_KEY:
            raise ValueError("ZAI_API_KEY is required")
        
        if '.' not in self.ZAI_API_KEY:
            raise ValueError("ZAI_API_KEY should be in format: id.secret")
        
        return True

# Global settings instance
settings = Settings()
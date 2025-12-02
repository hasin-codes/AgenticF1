import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    """Application settings"""
    
    # Z.AI Configuration
    ZAI_API_KEY: str = os.getenv("ZAI_API_KEY", "")
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Model Configuration
    DEFAULT_MODEL: str = "glm-4.6"
    DEFAULT_TEMPERATURE: float = 0.7
    DEFAULT_MAX_TOKENS: int = 2048
    
    def validate_zai_key(self) -> bool:
        """Validate ZAI API key format"""
        if not self.ZAI_API_KEY:
            raise ValueError("ZAI_API_KEY is required")
        
        if '.' not in self.ZAI_API_KEY:
            raise ValueError("ZAI_API_KEY should be in format: id.secret")
        
        return True

# Global settings instance
settings = Settings()
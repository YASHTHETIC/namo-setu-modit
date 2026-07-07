from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from backend.app.schemas.common import ORMModel


class AIChatRequest(BaseModel):
    message: str
    session_id: str | None = None


class AIChatResponse(BaseModel):
    response: str
    session_id: str
    tokens_used: int


class AISessionCreate(BaseModel):
    product_code: str
    model_name: str = "gpt-4o-mini"
    system_prompt: str | None = None


class AISessionRead(ORMModel):
    id: str
    product_code: str
    model_name: str
    token_count: int
    created_at: datetime


class AIMessageRead(ORMModel):
    id: str
    role: str
    content: str
    token_count: int
    created_at: datetime


class AIMaterialRecommendationRequest(BaseModel):
    requirements: str
    budget: float
    location: str


class AIMaterialRecommendationResponse(BaseModel):
    items: list[dict]
    total_estimated_cost: float
    reasoning: str


class AIBoqReaderRequest(BaseModel):
    boq_text: str


class AIBoqReaderResponse(BaseModel):
    items: list[dict]
    total_estimated_cost: float
    summary: str


class AIVendorMatchingRequest(BaseModel):
    requirements: str
    location: str
    budget: float


class AIVendorMatchingResponse(BaseModel):
    vendors: list[dict]
    match_score: float
    reasoning: str


class AITravelPlannerRequest(BaseModel):
    destination: str
    dates: str
    budget: float
    preferences: str


class AITravelPlannerResponse(BaseModel):
    itinerary: list[dict]
    estimated_cost: float
    tips: list[str]


class AITempleRecommendationRequest(BaseModel):
    preferences: str
    location: str
    budget: float


class AITempleRecommendationResponse(BaseModel):
    temples: list[dict]
    reasoning: str


class AIPricePredictionRequest(BaseModel):
    product_name: str
    quantity: int
    location: str


class AIPricePredictionResponse(BaseModel):
    predicted_price: float
    confidence: float
    factors: list[str]


class AIInventoryForecastRequest(BaseModel):
    product_id: str
    months: int = 6


class AIInventoryForecastResponse(BaseModel):
    forecast: list[dict]
    reorder_suggestion: str


class AICostEstimatorRequest(BaseModel):
    project_type: str
    specifications: str


class AICostEstimatorResponse(BaseModel):
    estimate: float
    breakdown: dict
    confidence: float


class AINegotiationAssistantRequest(BaseModel):
    product: str
    target_price: float
    supplier_name: str


class AINegotiationAssistantResponse(BaseModel):
    strategy: str
    talking_points: list[str]
    counter_offer: float


class AIProcurementAssistantRequest(BaseModel):
    query: str
    context: str | None = None


class AIProcurementAssistantResponse(BaseModel):
    answer: str
    sources: list[str]

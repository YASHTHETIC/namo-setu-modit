from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.models.enums import ProductCode
from backend.app.models.shared import AISession, AIMessage, AIChat
from backend.app.models.user import User
from backend.app.schemas.ai import (
    AIBoqReaderRequest,
    AIBoqReaderResponse,
    AIChatRequest,
    AIChatResponse,
    AICostEstimatorRequest,
    AICostEstimatorResponse,
    AIInventoryForecastRequest,
    AIInventoryForecastResponse,
    AIMaterialRecommendationRequest,
    AIMaterialRecommendationResponse,
    AINegotiationAssistantRequest,
    AINegotiationAssistantResponse,
    AIMessageRead,
    AIPricePredictionRequest,
    AIPricePredictionResponse,
    AIProcurementAssistantRequest,
    AIProcurementAssistantResponse,
    AISessionCreate,
    AISessionRead,
    AITempleRecommendationRequest,
    AITempleRecommendationResponse,
    AITravelPlannerRequest,
    AITravelPlannerResponse,
    AIVendorMatchingRequest,
    AIVendorMatchingResponse,
)
from backend.app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/chat", response_model=AIChatResponse)
async def chat(
    payload: AIChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AIChatResponse:
    svc = AIService(db)

    session_id = payload.session_id
    if not session_id:
        session = await svc.create_session(
            user_id=user.id,
            product_code=ProductCode.MODIT.value,
            model_name="gpt-4o-mini",
            system_prompt="You are a helpful assistant for construction and spiritual services.",
        )
        await db.commit()
        session_id = session.id

    result = await svc.chat(
        session_id=session_id,
        user_message=payload.message,
        system_prompt="You are a helpful assistant for construction and spiritual services. Be concise and helpful.",
        product_code=ProductCode.MODIT.value,
    )
    await db.commit()
    return AIChatResponse(**result)


@router.post("/material-recommendation", response_model=AIMaterialRecommendationResponse)
async def material_recommendation(
    payload: AIMaterialRecommendationRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AIMaterialRecommendationResponse:
    svc = AIService(db)
    result = await svc.material_recommendation(
        requirements=payload.requirements,
        budget=payload.budget,
        location=payload.location,
    )
    await db.commit()
    return AIMaterialRecommendationResponse(
        items=result.get("items", []),
        total_estimated_cost=result.get("total_estimated_cost", 0),
        reasoning=result.get("reasoning", ""),
    )


@router.post("/boq-reader", response_model=AIBoqReaderResponse)
async def boq_reader(
    payload: AIBoqReaderRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AIBoqReaderResponse:
    svc = AIService(db)
    result = await svc.boq_reader(boq_text=payload.boq_text)
    await db.commit()
    return AIBoqReaderResponse(
        items=result.get("items", []),
        total_estimated_cost=result.get("total_estimated_cost", 0),
        summary=result.get("summary", ""),
    )


@router.post("/vendor-matching", response_model=AIVendorMatchingResponse)
async def vendor_matching(
    payload: AIVendorMatchingRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AIVendorMatchingResponse:
    svc = AIService(db)
    result = await svc.vendor_matching(
        product_requirements=payload.requirements,
        location=payload.location,
        budget=payload.budget,
    )
    await db.commit()
    return AIVendorMatchingResponse(
        vendors=result.get("vendors", []),
        match_score=result.get("match_score", 0),
        reasoning=result.get("reasoning", ""),
    )


@router.post("/procurement-assistant", response_model=AIProcurementAssistantResponse)
async def procurement_assistant(
    payload: AIProcurementAssistantRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AIProcurementAssistantResponse:
    svc = AIService(db)
    answer = await svc.procurement_assistant(query=payload.query, context=payload.context)
    await db.commit()
    return AIProcurementAssistantResponse(answer=answer, sources=["ai-knowledge-base"])


@router.post("/travel-planner", response_model=AITravelPlannerResponse)
async def travel_planner(
    payload: AITravelPlannerRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AITravelPlannerResponse:
    svc = AIService(db)
    result = await svc.travel_planner(
        destination=payload.destination,
        dates=payload.dates,
        budget=payload.budget,
        preferences=payload.preferences,
    )
    await db.commit()
    return AITravelPlannerResponse(
        itinerary=result.get("itinerary", []),
        estimated_cost=result.get("estimated_cost", 0),
        tips=result.get("tips", []),
    )


@router.post("/temple-recommendation", response_model=AITempleRecommendationResponse)
async def temple_recommendation(
    payload: AITempleRecommendationRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AITempleRecommendationResponse:
    svc = AIService(db)
    result = await svc.temple_recommendation(
        user_preferences=payload.preferences,
        location=payload.location,
        budget=payload.budget,
    )
    await db.commit()
    return AITempleRecommendationResponse(
        temples=result.get("temples", []),
        reasoning=result.get("reasoning", ""),
    )


@router.post("/price-prediction", response_model=AIPricePredictionResponse)
async def price_prediction(
    payload: AIPricePredictionRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AIPricePredictionResponse:
    svc = AIService(db)
    result = await svc.price_prediction(
        product_name=payload.product_name,
        quantity=payload.quantity,
        location=payload.location,
    )
    await db.commit()
    return AIPricePredictionResponse(
        predicted_price=result.get("predicted_price", 0),
        confidence=result.get("confidence", 0),
        factors=result.get("factors", []),
    )


@router.post("/inventory-forecast", response_model=AIInventoryForecastResponse)
async def inventory_forecast(
    payload: AIInventoryForecastRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AIInventoryForecastResponse:
    svc = AIService(db)
    result = await svc.inventory_forecast(
        product_id=payload.product_id,
        months=payload.months,
    )
    await db.commit()
    return AIInventoryForecastResponse(
        forecast=result.get("forecast", []),
        reorder_suggestion=result.get("reorder_suggestion", ""),
    )


@router.post("/cost-estimator", response_model=AICostEstimatorResponse)
async def cost_estimator(
    payload: AICostEstimatorRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AICostEstimatorResponse:
    svc = AIService(db)
    result = await svc.cost_estimator(
        project_type=payload.project_type,
        specifications=payload.specifications,
    )
    await db.commit()
    return AICostEstimatorResponse(
        estimate=result.get("estimate", 0),
        breakdown=result.get("breakdown", {}),
        confidence=result.get("confidence", 0),
    )


@router.post("/negotiation-assistant", response_model=AINegotiationAssistantResponse)
async def negotiation_assistant(
    payload: AINegotiationAssistantRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AINegotiationAssistantResponse:
    svc = AIService(db)
    result = await svc.negotiation_assistant(
        product=payload.product,
        target_price=payload.target_price,
        supplier_name=payload.supplier_name,
    )
    await db.commit()
    return AINegotiationAssistantResponse(
        strategy=result.get("strategy", ""),
        talking_points=result.get("talking_points", []),
        counter_offer=result.get("counter_offer", 0),
    )


@router.get("/sessions", response_model=list[AISessionRead])
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[AISessionRead]:
    stmt = (
        select(AISession)
        .where(AISession.user_id == user.id, AISession.deleted_at.is_(None))
        .order_by(AISession.created_at.desc())
    )
    result = await db.execute(stmt)
    return [AISessionRead.model_validate(s) for s in result.scalars().all()]


@router.get("/sessions/{session_id}/messages", response_model=list[AIMessageRead])
async def get_session_messages(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[AIMessageRead]:
    session_obj = await db.get(AISession, session_id)
    if not session_obj or session_obj.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    chat_stmt = (
        select(AIChat)
        .where(AIChat.session_id == session_id, AIChat.deleted_at.is_(None))
        .order_by(AIChat.created_at.asc())
    )
    chat_result = await db.execute(chat_stmt)
    chats = chat_result.scalars().all()

    messages: list[AIMessageRead] = []
    for chat in chats:
        msg_stmt = (
            select(AIMessage)
            .where(AIMessage.chat_id == chat.id, AIMessage.deleted_at.is_(None))
            .order_by(AIMessage.created_at.asc())
        )
        msg_result = await db.execute(msg_stmt)
        messages.extend([AIMessageRead.model_validate(m) for m in msg_result.scalars().all()])

    return messages
